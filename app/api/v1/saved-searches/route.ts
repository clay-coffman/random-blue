import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { getApiSession } from "@/lib/auth-utils";
import { CompanyFilterParams } from "@/lib/company-filters";

export const dynamic = "force-dynamic";

const CADENCES = ["daily", "weekly", "off"] as const;
type Cadence = (typeof CADENCES)[number];

const CreateBody = z.object({
  name: z.string().trim().min(1).max(120),
  filters: CompanyFilterParams,
  cadence: z.enum(CADENCES).default("daily"),
});

function toWire(row: typeof savedSearches.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    filters: JSON.parse(row.filtersJson) as Record<string, unknown>,
    cadence: row.cadence as Cadence,
    last_run_at: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const session = await getApiSession(req);
  if (!session) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const rows = await db()
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, session.user.id))
    .orderBy(desc(savedSearches.createdAt));
  return NextResponse.json({ saved_searches: rows.map(toWire) });
}

export async function POST(req: Request) {
  const session = await getApiSession(req);
  if (!session) {
    return errorResponse("unauthorized", "Sign in required.", 401);
  }
  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid saved search payload.",
      400,
      parsed.error.format(),
    );
  }
  const { name, filters, cadence } = parsed.data;
  const filtersJson = JSON.stringify(filters);
  const [row] = await db()
    .insert(savedSearches)
    .values({
      userId: session.user.id,
      name,
      filtersJson,
      cadence,
    })
    .returning();
  return NextResponse.json(toWire(row), { status: 201 });
}
