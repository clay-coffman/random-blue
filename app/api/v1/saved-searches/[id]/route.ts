import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches } from "@/db/schema";
import { errorResponse } from "@/lib/api-error";
import { authorizeWrite } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const CADENCES = ["daily", "weekly", "off"] as const;

const PatchBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    cadence: z.enum(CADENCES).optional(),
  })
  .refine((v) => v.name !== undefined || v.cadence !== undefined, {
    message: "Provide at least one of: name, cadence.",
  });

function safeParseFilters(s: string): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toWire(row: typeof savedSearches.$inferSelect) {
  // Mirrors the safe parse in the list endpoint — keeps PATCH replies
  // consumable even if the row's filters_json is malformed.
  return {
    id: row.id,
    name: row.name,
    filters: safeParseFilters(row.filtersJson),
    cadence: row.cadence,
    last_run_at: row.lastRunAt ? row.lastRunAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

async function loadOwned(userId: string, id: string) {
  const rows = await db()
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

function denyWrite(auth: Awaited<ReturnType<typeof authorizeWrite>>) {
  if (auth.kind !== "denied") return null;
  if (auth.reason === "csrf") {
    return errorResponse("forbidden", "Cross-origin request blocked.", 403);
  }
  return errorResponse("unauthorized", "Sign in required.", 401);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeWrite(req);
  const denied = denyWrite(auth);
  if (denied) return denied;
  if (auth.kind !== "session") {
    return errorResponse("forbidden", "Sign in required.", 403);
  }
  const { id } = await params;
  const existing = await loadOwned(auth.user.id, id);
  if (!existing) return errorResponse("not_found", "Saved search not found.", 404);

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return errorResponse(
      "bad_request",
      "Invalid patch payload.",
      400,
      parsed.error.format(),
    );
  }
  const updates: Partial<typeof savedSearches.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.cadence !== undefined) updates.cadence = parsed.data.cadence;
  const [row] = await db()
    .update(savedSearches)
    .set(updates)
    .where(eq(savedSearches.id, id))
    .returning();
  return NextResponse.json(toWire(row));
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeWrite(req);
  const denied = denyWrite(auth);
  if (denied) return denied;
  if (auth.kind !== "session") {
    return errorResponse("forbidden", "Sign in required.", 403);
  }
  const { id } = await params;
  const existing = await loadOwned(auth.user.id, id);
  if (!existing) return errorResponse("not_found", "Saved search not found.", 404);
  await db().delete(savedSearches).where(eq(savedSearches.id, id));
  return new NextResponse(null, { status: 204 });
}
