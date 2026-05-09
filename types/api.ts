// Wire-format (snake_case) contracts for the Founder Navigator.
//
// These types describe what crosses the network — request and response
// bodies on `/api/v1/...`. Internal TS code uses camelCase types from
// `types/passport.ts`; convert at the boundary via `lib/api-codec.ts`.
//
// Request types are loose (partial — the form scaffolds them up over
// time). Response types are strict and `z.infer`-derived from the
// runtime validators in `schemas/*.ts` so the static types and the
// runtime validators can never drift apart.

import type {
  EnrichField,
  EnrichResponse,
  RecommendResponse,
  RecommendedResource,
} from "@/schemas/recommend";

export type { Bucket } from "@/schemas/recommend";

// ─── Request shapes (loose — partial intake submissions allowed) ──────

export type FounderPassportInputWire = {
  website_url?: string;
  county?: string;
  city?: string;
  stage?: string;
  industry?: string;
  communities: string[];
  goal?: string;
  urgency?: string;
  business_size?: string;
  needs: string[];
  constraints: string[];
};

export type FounderPassportWire = FounderPassportInputWire & {
  id: string;
  created_at: string;
  enriched_at?: string;
  enrichment_source?: string;
};

export type RecommendRequestWire = FounderPassportInputWire & {
  passport_id?: string;
};

export type EnrichRequestWire = { website_url: string };

// ─── Response shapes (strict — match the zod schemas at runtime) ──────

export type RecommendedResourceWire = RecommendedResource;
export type RecommendResponseWire = RecommendResponse;
export type EnrichFieldWire = EnrichField;
export type EnrichResponseWire = EnrichResponse;

// Documented error envelope from `lib/api-error.ts`.
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
