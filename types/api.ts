// Wire-format (snake_case) contracts for the Founder Navigator.
//
// These types describe what crosses the network — request and response
// bodies on `/api/v1/...`. Internal TS code uses camelCase types from
// `types/passport.ts`; convert at the boundary via `lib/api-codec.ts`.
//
// Scaffolded from `docs/architecture.md` § Data flow A and
// `docs/requirements.md`. Agent 2 owns this file going forward and may
// tighten the types when their endpoints land.

export type Bucket = "now" | "next" | "ignore";

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

export type RecommendRequestWire = FounderPassportInputWire;

export type RecommendedResourceWire = {
  resource_id: string;
  title: string;
  score: number;
  bucket: Bucket;
  reasons: string[];
  because: string;
  action_text: string;
  kind?: string;
  source_url?: string;
  contact_email?: string;
};

export type RecommendResponseWire = {
  passport_id: string;
  recommendations: RecommendedResourceWire[];
  generated_at: string;
};

// Smart prefill from a business website (Agent 2's enrich endpoint).
export type EnrichRequestWire = {
  website_url: string;
};

export type EnrichFieldWire = {
  name: string;
  value: unknown;
  confidence: number;
};

export type EnrichResponseWire = {
  fields: EnrichFieldWire[];
  degraded?: boolean;
};

// Documented error envelope from `lib/api-error.ts`.
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
