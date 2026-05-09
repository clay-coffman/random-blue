// Boundary converters between wire format (snake_case JSON) and
// internal TS types (camelCase). Per `AGENTS.md` § Coding Style.
//
// Also includes a defensive parser for `EnrichResponseWire` so the form
// doesn't blindly assign untrusted values into state.

import type {
  EnrichResponseWire,
  FounderPassportInputWire,
  RecommendedResourceWire,
  RecommendResponseWire,
} from "@/types/api";
import type {
  EnrichField,
  EnrichResult,
  FounderPassportInput,
  RecommendResult,
  RecommendedResource,
} from "@/types/passport";

const KNOWN_PASSPORT_FIELDS = [
  "websiteUrl",
  "county",
  "city",
  "stage",
  "industry",
  "communities",
  "goal",
  "urgency",
  "businessSize",
  "businessType",
  "needs",
  "constraints",
] as const;

export type PassportFieldName = (typeof KNOWN_PASSPORT_FIELDS)[number];

const PASSPORT_FIELD_SET = new Set<string>(KNOWN_PASSPORT_FIELDS);

const ARRAY_FIELDS: ReadonlySet<PassportFieldName> = new Set([
  "communities",
  "needs",
  "constraints",
]);

const STRING_FIELDS: ReadonlySet<PassportFieldName> = new Set([
  "websiteUrl",
  "county",
  "city",
  "stage",
  "industry",
  "goal",
  "urgency",
  "businessSize",
  "businessType",
]);

// snake_case → camelCase mapping for incoming enrich field names.
const WIRE_TO_CAMEL: Record<string, PassportFieldName> = {
  website_url: "websiteUrl",
  websiteUrl: "websiteUrl",
  county: "county",
  city: "city",
  stage: "stage",
  industry: "industry",
  communities: "communities",
  goal: "goal",
  urgency: "urgency",
  business_size: "businessSize",
  businessSize: "businessSize",
  business_type: "businessType",
  businessType: "businessType",
  needs: "needs",
  constraints: "constraints",
};

export function toWirePassportInput(
  p: FounderPassportInput,
): FounderPassportInputWire {
  return {
    website_url: p.websiteUrl,
    county: p.county,
    city: p.city,
    stage: p.stage,
    industry: p.industry,
    communities: p.communities,
    goal: p.goal,
    urgency: p.urgency,
    business_size: p.businessSize,
    business_type: p.businessType,
    needs: p.needs,
    constraints: p.constraints,
    enrichment_source: p.enrichmentSource,
  };
}

export function fromWirePassportInput(
  w: FounderPassportInputWire,
): FounderPassportInput {
  return {
    websiteUrl: w.website_url,
    county: w.county,
    city: w.city,
    stage: w.stage,
    industry: w.industry,
    communities: w.communities ?? [],
    goal: w.goal,
    urgency: w.urgency,
    businessSize: w.business_size,
    businessType: w.business_type,
    needs: w.needs ?? [],
    constraints: w.constraints ?? [],
    enrichmentSource: w.enrichment_source,
  };
}

export function fromWireRecommendedResource(
  w: RecommendedResourceWire,
): RecommendedResource {
  return {
    resourceId: w.resource_id,
    title: w.title,
    score: w.score,
    bucket: w.bucket,
    reasons: w.reasons,
    because: w.because,
    actionText: w.action_text,
    kind: w.kind,
    sourceUrl: w.source_url,
    contactEmail: w.contact_email,
  };
}

export function toWireRecommendedResource(
  r: RecommendedResource,
): RecommendedResourceWire {
  return {
    resource_id: r.resourceId,
    title: r.title,
    score: r.score,
    bucket: r.bucket,
    reasons: r.reasons,
    because: r.because,
    action_text: r.actionText,
    kind: r.kind,
    source_url: r.sourceUrl,
    contact_email: r.contactEmail,
  };
}

export function fromWireRecommendResponse(
  w: RecommendResponseWire,
): RecommendResult {
  return {
    passportId: w.passport_id,
    narrative: w.narrative,
    recommendations: w.recommendations.map(fromWireRecommendedResource),
    generatedAt: w.generated_at,
    degraded: w.degraded,
  };
}

export function toWireRecommendResponse(
  r: RecommendResult,
): RecommendResponseWire {
  return {
    passport_id: r.passportId,
    narrative: r.narrative,
    recommendations: r.recommendations.map(toWireRecommendedResource),
    generated_at: r.generatedAt,
    degraded: r.degraded,
  };
}

// Defensive parse for an EnrichResponse. Drops any field whose name is
// not in the known passport-field allow-list, and validates value type
// matches the field's expected shape (string vs string[]).
export function parseEnrichResponse(raw: unknown): EnrichResult | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<EnrichResponseWire>;
  if (!Array.isArray(obj.fields)) return null;

  const fields: EnrichField[] = [];
  for (const f of obj.fields) {
    if (!f || typeof f !== "object") continue;
    const wireName = typeof f.name === "string" ? f.name : "";
    const camel = WIRE_TO_CAMEL[wireName];
    if (!camel || !PASSPORT_FIELD_SET.has(camel)) continue;

    if (ARRAY_FIELDS.has(camel)) {
      if (!Array.isArray(f.value)) continue;
      const cleaned = f.value.filter((v): v is string => typeof v === "string");
      if (cleaned.length === 0) continue;
      fields.push({
        name: camel,
        value: cleaned,
        confidence: typeof f.confidence === "number" ? f.confidence : 0,
      });
    } else if (STRING_FIELDS.has(camel)) {
      if (typeof f.value !== "string" || f.value.length === 0) continue;
      fields.push({
        name: camel,
        value: f.value,
        confidence: typeof f.confidence === "number" ? f.confidence : 0,
      });
    }
  }

  return {
    fields,
    degraded: obj.degraded === true,
  };
}
