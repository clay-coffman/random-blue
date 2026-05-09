// API contracts for the Founder Navigator.
//
// These types are scaffolded from `docs/architecture.md` § Data flow A
// and `docs/requirements.md`. Agent 2 owns this file going forward and
// may tighten the types when their endpoints land. Wire format is
// snake_case; the front-end consumes these shapes verbatim.

export type Bucket = "now" | "next" | "ignore";

export type FounderPassportInput = {
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

export type FounderPassport = FounderPassportInput & {
  id: string;
  created_at: string;
  enriched_at?: string;
  enrichment_source?: string;
};

export type RecommendRequest = FounderPassportInput;

export type RecommendedResource = {
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

export type RecommendResponse = {
  passport_id: string;
  recommendations: RecommendedResource[];
  generated_at: string;
};

// Smart prefill from a business website (Agent 2's enrich endpoint).
export type EnrichRequest = {
  website_url: string;
};

export type EnrichField = {
  name: keyof FounderPassportInput | string;
  value: unknown;
  confidence: number;
};

export type EnrichResponse = {
  fields: EnrichField[];
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
