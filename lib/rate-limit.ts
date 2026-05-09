import { eq, sql } from "drizzle-orm";
import { rateLimit as rateLimitTable } from "@/db/schema.auth";
import { db } from "./db";
import { newId } from "./ids";

// Lightweight per-IP rate limiter for our own Next.js API routes.
//
// Backed by the same `rate_limit` D1 table Better Auth uses for its
// internal limits, but with a distinct key prefix so the two
// limiters don't collide. Better Auth handles its own routes via
// `customRules` in auth.ts; this helper handles the routes Better
// Auth doesn't see (e.g. POST /api/auth/start-signup).
//
// The window is sliding: each request resets `lastRequest` and
// increments `count`; if the previous request was older than
// `windowSeconds`, count is reset to 1.

export async function checkRateLimit(opts: {
  key: string;
  windowSeconds: number;
  max: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;

  const [existing] = await db()
    .select()
    .from(rateLimitTable)
    .where(eq(rateLimitTable.key, opts.key))
    .limit(1);

  if (!existing) {
    await db()
      .insert(rateLimitTable)
      .values({
        id: newId("rl"),
        key: opts.key,
        count: 1,
        lastRequest: now,
      })
      .onConflictDoUpdate({
        target: rateLimitTable.key,
        set: { count: 1, lastRequest: now },
      });
    return { ok: true };
  }

  const elapsed = now - existing.lastRequest;
  if (elapsed > windowMs) {
    await db()
      .update(rateLimitTable)
      .set({ count: 1, lastRequest: now })
      .where(eq(rateLimitTable.key, opts.key));
    return { ok: true };
  }

  if (existing.count >= opts.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - elapsed) / 1000)),
    };
  }

  await db()
    .update(rateLimitTable)
    .set({
      count: sql`${rateLimitTable.count} + 1`,
      lastRequest: now,
    })
    .where(eq(rateLimitTable.key, opts.key));
  return { ok: true };
}

// cf-connecting-ip is the real client IP on Cloudflare Workers
// (x-forwarded-for is stripped). Falls back to a constant key so
// requests without the header still hit the same bucket — defensive,
// since they shouldn't be possible in production.
export function clientIpKey(req: Request, route: string): string {
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  return `${route}:${ip}`;
}
