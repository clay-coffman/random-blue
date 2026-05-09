import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeSessionWrite, getApiSession } from "@/lib/auth-utils";
import { newId } from "@/lib/ids";
import { InvestorPreferencesSchema } from "@/lib/investor-schema";

export const dynamic = "force-dynamic";

// POST: upsert caller's investor profile (one row per user). The
// payload is validated against the same Zod schema the form uses, so
// the closed-enum guarantees survive curl-side bypass attempts.
export async function POST(req: Request) {
  const auth = await authorizeSessionWrite(req);
  if (auth.kind === "denied") {
    if (auth.reason === "csrf") {
      return errorResponse("forbidden", "Cross-origin request blocked.", 403);
    }
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const session = { user: auth.user };

  const raw = await req.json().catch(() => null);
  const parsed = InvestorPreferencesSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid investor preferences.",
      400,
      parsed.error.flatten(),
    );
  }
  const body = parsed.data;

  const userId = session.user.id;
  const [existing] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, userId))
    .limit(1);

  const values = {
    firmName: body.firm_name,
    investorType: body.investor_type,
    stagesJson: JSON.stringify(body.stages),
    sectorsJson: JSON.stringify(body.sectors),
    checkSizeMin: body.check_size_min,
    checkSizeMax: body.check_size_max,
    geoFocusJson: JSON.stringify(body.geo_focus),
  };

  if (existing) {
    await db()
      .update(investorProfiles)
      .set(values)
      .where(eq(investorProfiles.id, existing.id));
    return NextResponse.json({ id: existing.id, status: "updated" });
  }

  const id = newId("inv");
  await db()
    .insert(investorProfiles)
    .values({ id, userId, ...values });
  return NextResponse.json({ id, status: "created" }, { status: 201 });
}

// GET: caller's own profile (404 if none).
export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);

  const [row] = await db()
    .select()
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, session.user.id))
    .limit(1);
  if (!row) return errorResponse("not_found", "No profile yet.", 404);

  return NextResponse.json({
    profile: {
      id: row.id,
      firm_name: row.firmName,
      investor_type: row.investorType,
      stages: row.stagesJson ? JSON.parse(row.stagesJson) : [],
      sectors: row.sectorsJson ? JSON.parse(row.sectorsJson) : [],
      check_size_min: row.checkSizeMin,
      check_size_max: row.checkSizeMax,
      geo_focus: row.geoFocusJson ? JSON.parse(row.geoFocusJson) : [],
    },
  });
}
