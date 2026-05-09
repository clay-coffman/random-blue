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

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

type CronResult = {
  ran: number;
  emailed: number;
  skipped_empty: number;
  errors: { id: string; error: string }[];
};

export async function POST(req: Request) {
  return run(req);
}

// Cloudflare scheduled() bridges to fetch with a GET on the route, but
// also accept POST for manual `curl` smoke tests.
export async function GET(req: Request) {
  return run(req);
}

async function run(req: Request): Promise<NextResponse> {
  if (!hasMachineToken(req)) {
    return errorResponse("forbidden", "Machine token required.", 403);
  }

  const now = Date.now();
  const dailyFloor = new Date(now - DAY_MS);
  const weeklyFloor = new Date(now - WEEK_MS);

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

  for (const c of candidates) {
    result.ran++;
    try {
      const filtersRaw = JSON.parse(c.filtersJson) as Record<string, unknown>;
      const parsed = CompanyFilterParams.safeParse(filtersRaw);
      if (!parsed.success) {
        result.errors.push({ id: c.id, error: "invalid_filters" });
        continue;
      }
      const { companies: matched } = await listCompanies(parsed.data, 500);
      const currentIds = matched.map((m) => m.id);
      const previous = c.lastMatchIdsJson
        ? (JSON.parse(c.lastMatchIdsJson) as string[])
        : [];
      const previousSet = new Set(previous);
      const newIds = currentIds.filter((id) => !previousSet.has(id));

      // First-ever run: don't blast a "0 → N" email. Just baseline.
      const isFirstRun = c.lastRunAt === null;

      if (newIds.length > 0 && !isFirstRun) {
        const newCompanies = matched.filter((m) => newIds.includes(m.id));
        const unsubToken = await signToken({
          k: "ss-unsub",
          id: c.id,
          exp: Date.now() + 365 * DAY_MS,
        });
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

      await db()
        .update(savedSearches)
        .set({
          lastRunAt: new Date(now),
          lastMatchIdsJson: JSON.stringify(currentIds),
          // Bump updatedAt explicitly — $onUpdate fires on .set() but
          // only when at least one tracked column changes via the
          // proxy; safer to set it ourselves for clarity.
          updatedAt: new Date(now),
        })
        .where(eq(savedSearches.id, c.id));
    } catch (err) {
      result.errors.push({
        id: c.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json(result);
}

