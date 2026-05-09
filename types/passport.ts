// Internal (camelCase) TS types for the Founder Navigator. These mirror
// `types/api.ts` (wire format, snake_case) but use camelCase for use
// inside React state, the form, the mock client, and the plan view.
// Convert at the network boundary via `lib/api-codec.ts`.

import type { Bucket } from "./api";

export type { Bucket };

export type FounderPassportInput = {
  websiteUrl?: string;
  county?: string;
  city?: string;
  stage?: string;
  industry?: string;
  communities: string[];
  goal?: string;
  urgency?: string;
  businessSize?: string;
  needs: string[];
  constraints: string[];
};

export type FounderPassport = FounderPassportInput & {
  id: string;
  createdAt: string;
  enrichedAt?: string;
  enrichmentSource?: string;
};

export type RecommendedResource = {
  resourceId: string;
  title: string;
  score: number;
  bucket: Bucket;
  reasons: string[];
  because: string;
  actionText: string;
  kind?: string;
  sourceUrl?: string;
  contactEmail?: string;
};

export type RecommendResult = {
  passportId: string;
  recommendations: RecommendedResource[];
  generatedAt: string;
};

export type EnrichField = {
  name: string;
  value: unknown;
  confidence: number;
};

export type EnrichResult = {
  fields: EnrichField[];
  degraded?: boolean;
};
