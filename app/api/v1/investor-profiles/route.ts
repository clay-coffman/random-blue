import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { investorProfiles } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession } from "@/lib/auth-utils";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

// POST: upsert caller's investor profile (one row per user).
export async function POST(req: Request) {
  const session = await getApiSession(req);
  if (!session) return errorResponse("unauthorized", "Sign in required.", 401);

  const body = (await req.json().catch(() => null)) as {
    firm_name?: string;
    investor_type?: string;
    stages?: string[];
    sectors?: string[];
    check_size_min?: number;
    check_size_max?: number;
    geo_focus?: string[];
  } | null;
  if (!body) return errorResponse("bad_request", "Body required.", 400);

  const userId = session.user.id;
  const [existing] = await db()
    .select({ id: investorProfiles.id })
    .from(investorProfiles)
    .where(eq(investorProfiles.userId, userId))
    .limit(1);

  const values = {
    firmName: body.firm_name ?? null,
    investorType: body.investor_type ?? null,
    stagesJson: body.stages ? JSON.stringify(body.stages) : null,
    sectorsJson: body.sectors ? JSON.stringify(body.sectors) : null,
    checkSizeMin: body.check_size_min ?? null,
    checkSizeMax: body.check_size_max ?? null,
    geoFocusJson: body.geo_focus ? JSON.stringify(body.geo_focus) : null,
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
