import { NextResponse } from "next/server";
import { and, eq, lte, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches, searchAlertDeliveries } from "@/db/schema";
import { user } from "@/db/schema.auth";
import { errorResponse } from "@/lib/api-error";
import { hasMachineToken } from "@/lib/auth-utils";
import { listCompanies } from "@/lib/companies-list";
import { CompanyFilterParams } from "@/lib/company-filters";
import { sendSavedSearchAlertEmail } from "@/lib/email";
import { signToken } from "@/lib/signed-token";
import { env } from "@/lib/cf";

export const dynamic = "force-dynamic";

// One-cron-fits-all: run daily, dispatch each saved search whose
// cadence window has elapsed. Weekly searches use the same loop with
// a 7-day floor on `last_run_at`.
//
// The handler is idempotent on the per-search delta: if a previous
// run committed a delivery for the same set of new IDs, the JSON
// blob in `last_match_ids_json` will already include them, and the
// `setDiff` below will produce an empty array — no duplicate email.

const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// Loosen the daily/weekly windows by 30 minutes so cron jitter
// (e.g. yesterday's run finished at 13:01 UTC, today's runs at
// 13:00 UTC) doesn't drop a candidate to the next-day's run. Cheap
// at the cost of an occasional re-evaluation.
const FLOOR_SLACK_MS = 30 * MIN_MS;

const MAX_MATCHES = 500;

type CronResult = {
  ran: number;
  emailed: number;
  skipped_empty: number;
  errors: { id: string; error: string }[];
};

// Drives the daily delta runner. Triggered by GitHub Actions cron
// (see `.github/workflows/cron-saved-searches.yml`). GET is kept for
// manual `curl` smoke tests; the workflow uses POST.
export async function POST(req: Request) {
  return run(req);
}

export async function GET(req: Request) {
  return run(req);
}

async function run(req: Request): Promise<NextResponse> {
  if (!hasMachineToken(req)) {
    return errorResponse("forbidden", "Machine token required.", 403);
  }

  const now = Date.now();
  const dailyFloor = new Date(now - (DAY_MS - FLOOR_SLACK_MS));
  const weeklyFloor = new Date(now - (WEEK_MS - FLOOR_SLACK_MS));

  // Load both cadences in one query, then partition by window in JS.
  const candidates = await db()
    .select({
      id: savedSearches.id,
      userId: savedSearches.userId,
      name: savedSearches.name,
      filtersJson: savedSearches.filtersJson,
      cadence: savedSearches.cadence,
      lastRunAt: savedSearches.lastRunAt,
      lastMatchIdsJson: savedSearches.lastMatchIdsJson,
      email: user.email,
    })
    .from(savedSearches)
    .innerJoin(user, eq(savedSearches.userId, user.id))
    .where(
      or(
        and(
          eq(savedSearches.cadence, "daily"),
          or(isNull(savedSearches.lastRunAt), lte(savedSearches.lastRunAt, dailyFloor)),
        ),
        and(
          eq(savedSearches.cadence, "weekly"),
          or(isNull(savedSearches.lastRunAt), lte(savedSearches.lastRunAt, weeklyFloor)),
        ),
      ),
    );

  const result: CronResult = { ran: 0, emailed: 0, skipped_empty: 0, errors: [] };
  const baseUrl = (env().BETTER_AUTH_URL ?? "https://startup.utah.gov").replace(
    /\/$/,
    "",
  );

  // Sequential for simplicity. Worker CPU budget caps each invocation
  // at ~30s; at our current scale (a handful of saved searches) this
  // is comfortable. If subscriber count grows, switch to a chunked
  // dispatch via Workers Queues so a single invocation handles only
  // a slice of the candidates.
  for (const c of candidates) {
    result.ran++;
    let nextMatchIdsJson: string | null = c.lastMatchIdsJson;
    try {
      const filtersRaw = JSON.parse(c.filtersJson) as Record<string, unknown>;
      const parsed = CompanyFilterParams.safeParse(filtersRaw);
      if (!parsed.success) {
        result.errors.push({ id: c.id, error: "invalid_filters" });
        // Still advance lastRunAt so this row leaves the candidate
        // set until the next cadence window. PATCH only accepts
        // name/cadence today, so the actual repair path for corrupt
        // filters_json is delete + re-create from /map; advancing
        // lastRunAt at least keeps this row from re-erroring every
        // cron tick.
      } else {
        // listCompanies caps at 500. For searches whose filters
        // legitimately match more than that, the order-dependent
        // window can shift between runs and re-flag rows as "new".
        // Today's seeded dataset is ~254 companies so this is not
        // urgent — flag for when the dataset grows.
        // TODO(scale): page through > MAX_MATCHES results, or use a
        // counted set delta instead of an ID-set delta.
        const { companies: matched } = await listCompanies(parsed.data, MAX_MATCHES);
        const currentIds = matched.map((m) => m.id);

        let previous: string[] = [];
        try {
          if (c.lastMatchIdsJson) {
            const parsedPrev = JSON.parse(c.lastMatchIdsJson) as unknown;
            if (Array.isArray(parsedPrev)) previous = parsedPrev.map(String);
          }
        } catch {
          // Fall through with previous=[]; the isFirstRun guard below
          // will treat this as an unbaselined run.
        }

        // First run, or never-baselined: just store the current set.
        // Do NOT email a "0 → N" blast. The check covers both the
        // never-ran case and any future state where the JSON column
        // got cleared/corrupted (manual SQL edit, half-failed write).
        const isFirstRun =
          c.lastRunAt === null || c.lastMatchIdsJson === null;

        const previousSet = new Set(previous);
        const newIds = currentIds.filter((id) => !previousSet.has(id));

        if (newIds.length > 0 && !isFirstRun) {
          const newCompanies = matched.filter((m) => newIds.includes(m.id));
          const unsubToken = await signToken({ k: "ss-unsub", id: c.id });
          await sendSavedSearchAlertEmail({
            to: c.email,
            searchName: c.name,
            manageUrl: `${baseUrl}/settings#notifications`,
            unsubscribeUrl: `${baseUrl}/u/saved-search?t=${encodeURIComponent(unsubToken)}`,
            newCompanies: newCompanies.map((nc) => ({
              name: nc.name,
              slug: nc.slug,
              sector: nc.sector,
              city: nc.city,
              summary: nc.summary,
            })),
          });
          await db().insert(searchAlertDeliveries).values({
            savedSearchId: c.id,
            newMatchIdsJson: JSON.stringify(newIds),
          });
          result.emailed++;
        } else {
          result.skipped_empty++;
        }

        nextMatchIdsJson = JSON.stringify(currentIds);
      }
    } catch (err) {
      result.errors.push({
        id: c.id,
        error: err instanceof Error ? err.message : String(err),
      });
      // Still advance lastRunAt — see comment below.
    }

    // Always bump lastRunAt, even on error, so a row with a
    // permanently broken filtersJson doesn't get retried every
    // cron tick forever. The user (or admin) can repair via PATCH;
    // until then the row exits the candidate set for the next
    // cadence window.
    try {
      await db()
        .update(savedSearches)
        .set({
          lastRunAt: new Date(now),
          lastMatchIdsJson: nextMatchIdsJson,
          updatedAt: new Date(now),
        })
        .where(eq(savedSearches.id, c.id));
    } catch (err) {
      result.errors.push({
        id: c.id,
        error: `update_failed:${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return NextResponse.json(result);
}
