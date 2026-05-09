// Pre-warm the persona plans by hitting POST /api/v1/resources/recommend
// for each persona id. Populates `founder_passports.narrative_text` and
// `recommendations` rows so the demo's first click on a persona renders
// from cache (<100ms) instead of waiting on a fresh Claude call (~3-6s
// with sonnet).
//
// Usage:
//   npm run warm-personas                              # dev (default base url)
//   ATLAS_BASE_URL=https://startupstateatlas.dev \
//     npm run warm-personas                            # prod
//
// Idempotent: each call deletes and reinserts the persona's recs.

const PERSONAS = ["jordan", "maria", "marcus", "priya", "david", "amir"];
const BASE = process.env.ATLAS_BASE_URL ?? "http://localhost:3000";

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

async function main() {
  console.log(`Warming personas against ${BASE} ...`);
  let okCount = 0;
  for (const p of PERSONAS) {
    if (await warm(p)) okCount++;
  }
  console.log(`\nDone: ${okCount}/${PERSONAS.length} succeeded.`);
  if (okCount < PERSONAS.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
