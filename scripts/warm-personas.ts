// Pre-warm the persona plans by hitting POST /api/v1/resources/recommend
// for each persona id. Populates `founder_passports.narrative_text` and
// `recommendations` rows so the demo's first click on a persona renders
// from cache (<100ms) instead of waiting on a fresh Claude call (~5-7s
// with sonnet).
//
// Usage:
//   npm run warm-personas                              # dev (default base url)
//   ATLAS_BASE_URL=https://startupstateatlas.dev \
//     npm run warm-personas                            # prod
//
// Idempotent: each call deletes and reinserts the persona's recs.
//
// The recommend endpoint is per-IP rate-limited to 5/60s
// (RECOMMEND_LIMIT in wrangler.jsonc). To finish all six personas
// from one IP we sleep ~13s between calls — total runtime ~70-100s.

import { personas } from "@/lib/personas";

const PERSONA_IDS = personas.map((p) => p.id);
const BASE = process.env.ATLAS_BASE_URL ?? "http://localhost:3000";
// 60s window / 5 req limit = 12s/req; +1s buffer so retries / clock skew
// don't push us over the edge on the 5th call.
const PACE_MS = 13_000;

async function warm(persona: string) {
  const url = `${BASE}/api/v1/resources/recommend`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ passport_id: `fp_${persona}` }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    console.error(`✗ ${persona.padEnd(8)} ${res.status} ${ms}ms — ${text}`);
    return false;
  }
  const body = (await res.json()) as {
    narrative?: string;
    degraded?: boolean;
    recommendations?: unknown[];
  };
  const recCount = body.recommendations?.length ?? 0;
  const narrLen = body.narrative?.length ?? 0;
  const tag = body.degraded ? " (degraded)" : "";
  console.log(
    `✓ ${persona.padEnd(8)} ${res.status} ${ms}ms — ${recCount} recs, ${narrLen} chars${tag}`,
  );
  return true;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(
    `Warming ${PERSONA_IDS.length} personas against ${BASE} (pacing ${PACE_MS}ms between calls) ...`,
  );
  let okCount = 0;
  for (let i = 0; i < PERSONA_IDS.length; i++) {
    if (await warm(PERSONA_IDS[i])) okCount++;
    if (i < PERSONA_IDS.length - 1) await sleep(PACE_MS);
  }
  console.log(`\nDone: ${okCount}/${PERSONA_IDS.length} succeeded.`);
  if (okCount < PERSONA_IDS.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
