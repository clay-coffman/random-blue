// Parallel.ai client for the founder-website enrich endpoint.
// Mirrors lib/anthropic.ts in shape: thin wrapper around fetch, reads the
// API key from env() at call time, never caches a client at module scope.
//
// Failure semantics: this client NEVER throws on upstream timeout / 5xx.
// It returns `{ degraded: true, fields: {}, ... }` so the route handler
// can pass it through to the front-end and the form keeps working.

import { env } from "./cf";
import type { EnrichResponse } from "@/types/api";

export const PARALLEL_BASE = "https://api.parallel.ai";
const HARD_TIMEOUT_MS = 15_000;

// Keys we attempt to extract. The Parallel.ai response is mapped onto these
// names so the front-end (Agent 3) sees a stable schema regardless of the
// underlying enrichment provider.
export const ENRICH_KEYS = [
  "industry",
  "stage",
  "city",
  "county",
  "business_type",
  "needs",
] as const;
export type EnrichKey = (typeof ENRICH_KEYS)[number];

type RawSearchResult = {
  // We don't model Parallel's full schema; we just pull whatever JSON it
  // returns and map onto our keys defensively below.
  results?: Array<{
    text?: string;
    structured?: Record<string, unknown>;
  }>;
  structured?: Record<string, unknown>;
};

function degraded(url: string): EnrichResponse {
  return {
    fields: {},
    source_url: url,
    fetched_at: Date.now(),
    degraded: true,
  };
}

// Pull a single field out of Parallel's loosely-typed structured payload.
function pickField(
  raw: Record<string, unknown> | undefined,
  key: string,
): { value: unknown; confidence: number } | null {
  if (!raw) return null;
  const node = raw[key];
  if (node === undefined || node === null) return null;
  if (
    typeof node === "object" &&
    node !== null &&
    "value" in node &&
    "confidence" in node
  ) {
    const v = (node as { value: unknown }).value;
    const c = Number((node as { confidence: unknown }).confidence);
    if (v === null || v === undefined) return null;
    return { value: v, confidence: Number.isFinite(c) ? c : 0.5 };
  }
  // Plain scalar / array value — assume mid confidence.
  return { value: node, confidence: 0.5 };
}

export async function enrichWebsite(url: string): Promise<EnrichResponse> {
  const apiKey = env().PARALLEL_API_KEY;
  if (!apiKey) return degraded(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HARD_TIMEOUT_MS);

  try {
    // Parallel.ai Search API — fast website-extraction path. Spec:
    // https://docs.parallel.ai/api-reference/search-api/search
    const res = await fetch(`${PARALLEL_BASE}/v1beta/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        objective:
          "Extract company information from this Utah-area business website. " +
          "Return industry (GOED canonical category if possible), stage " +
          "(idea/pre_seed/mvp/paying_customers/growth/mature), city, county, " +
          "business_type (e.g., 'B2B SaaS'), and an array of immediate needs.",
        search_queries: [url],
        max_results: 1,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return degraded(url);

    const raw = (await res.json()) as RawSearchResult;
    const structured =
      raw.structured ??
      raw.results?.[0]?.structured ??
      undefined;

    const fields: EnrichResponse["fields"] = {};
    for (const key of ENRICH_KEYS) {
      const picked = pickField(structured, key);
      if (picked) fields[key] = picked;
    }

    return {
      fields,
      source_url: url,
      fetched_at: Date.now(),
    };
  } catch {
    // AbortError, network error, JSON parse error — all degrade gracefully.
    return degraded(url);
  } finally {
    clearTimeout(timer);
  }
}
