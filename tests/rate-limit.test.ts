import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Toy in-memory store mirroring the rate_limit table shape.
type Row = { id: string; key: string; count: number; lastRequest: number };
const store = new Map<string, Row>();

vi.mock("@/lib/db", () => ({
  db: () => ({
    select: () => ({
      from: () => ({
        where: (predicate: { key: string }) => ({
          limit: async () => {
            // Drizzle's `eq(table.key, value)` produces an SQL fragment
            // we don't introspect here — the tests stash the queried
            // key on a global before calling, so we can look it up.
            const key = (globalThis as unknown as { __testKey?: string })
              .__testKey;
            void predicate;
            const row = key ? store.get(key) : undefined;
            return row ? [row] : [];
          },
        }),
      }),
    }),
    insert: () => ({
      values: (row: Row) => ({
        onConflictDoUpdate: async ({
          set,
        }: {
          set: { count: number; lastRequest: number };
        }) => {
          const existing = store.get(row.key);
          store.set(row.key, {
            ...row,
            count: existing ? set.count : row.count,
            lastRequest: existing ? set.lastRequest : row.lastRequest,
          });
        },
      }),
    }),
    update: () => ({
      set: (set: { count?: number; lastRequest?: number } | { count: unknown; lastRequest: number }) => ({
        where: async () => {
          const key = (globalThis as unknown as { __testKey?: string })
            .__testKey;
          if (!key) return;
          const existing = store.get(key);
          if (!existing) return;
          // Either a literal {count, lastRequest} or a SQL-fragment
          // `count + 1` for the increment branch — the helper does
          // both. The fragment isn't a number, so detect and increment.
          const incoming = set as { count: unknown; lastRequest: number };
          const nextCount =
            typeof incoming.count === "number"
              ? incoming.count
              : existing.count + 1;
          store.set(key, {
            ...existing,
            count: nextCount,
            lastRequest: incoming.lastRequest,
          });
        },
      }),
    }),
  }),
}));

import { checkRateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  store.clear();
});

afterEach(() => {
  delete (globalThis as { __testKey?: string }).__testKey;
});

describe("checkRateLimit", () => {
  it("allows the first request", async () => {
    (globalThis as { __testKey?: string }).__testKey = "foo:1.2.3.4";
    const r = await checkRateLimit({
      key: "foo:1.2.3.4",
      windowSeconds: 60,
      max: 3,
    });
    expect(r).toEqual({ ok: true });
  });

  it("blocks once the count hits the cap inside the window", async () => {
    (globalThis as { __testKey?: string }).__testKey = "foo:1.2.3.4";
    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit({
        key: "foo:1.2.3.4",
        windowSeconds: 60,
        max: 3,
      });
      expect(r.ok).toBe(true);
    }
    const blocked = await checkRateLimit({
      key: "foo:1.2.3.4",
      windowSeconds: 60,
      max: 3,
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("resets the window after the elapsed time exceeds the window", async () => {
    (globalThis as { __testKey?: string }).__testKey = "foo:1.2.3.4";
    // Seed the store with an "old" entry whose lastRequest is past
    // the window — the helper should treat it as a fresh window.
    store.set("foo:1.2.3.4", {
      id: "rl_old",
      key: "foo:1.2.3.4",
      count: 99, // already over the max
      lastRequest: Date.now() - 120_000, // 2 min ago
    });
    const r = await checkRateLimit({
      key: "foo:1.2.3.4",
      windowSeconds: 60,
      max: 3,
    });
    expect(r).toEqual({ ok: true });
  });
});
