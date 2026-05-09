import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { newId } from "@/lib/ids";
import { user } from "./schema.auth";

export * from "./schema.auth";

const now = () => new Date();

// ─── Resources ───────────────────────────────────────────────────────

export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    sourceUrl: text("source_url"),
    kind: text("kind"),
    contactEmail: text("contact_email"),
    lastUpdatedAt: integer("last_updated_at", { mode: "timestamp_ms" }).$defaultFn(
      now,
    ),
  },
  (t) => [index("resources_kind_idx").on(t.kind)],
);

export const resourceLocations = sqliteTable(
  "resource_locations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    county: text("county"),
    city: text("city"),
    statewide: integer("statewide", { mode: "boolean" })
      .default(false)
      .notNull(),
  },
  (t) => [
    index("resource_locations_county_idx").on(t.county),
    index("resource_locations_resource_idx").on(t.resourceId),
  ],
);

export const resourceIndustries = sqliteTable(
  "resource_industries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    industry: text("industry").notNull(),
  },
  (t) => [
    index("resource_industries_industry_idx").on(t.industry),
    index("resource_industries_resource_idx").on(t.resourceId),
  ],
);

export const resourceCommunities = sqliteTable(
  "resource_communities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    community: text("community").notNull(),
  },
  (t) => [
    index("resource_communities_community_idx").on(t.community),
    index("resource_communities_resource_idx").on(t.resourceId),
  ],
);

export const resourceTopics = sqliteTable(
  "resource_topics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
  },
  (t) => [
    index("resource_topics_topic_idx").on(t.topic),
    index("resource_topics_resource_idx").on(t.resourceId),
  ],
);

// ─── Companies ───────────────────────────────────────────────────────

export const companies = sqliteTable(
  "companies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("co")),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    website: text("website"),
    description: text("description"),
    sector: text("sector"),
    stage: text("stage"),
    employeeCount: text("employee_count"),
    hiringStatus: integer("hiring_status", { mode: "boolean" })
      .default(false)
      .notNull(),
    foundingYear: integer("founding_year"),
    linkedin: text("linkedin"),
    logoUrl: text("logo_url"),
    founderTeamJson: text("founder_team_json"),
    addressText: text("address_text"),
    lat: real("lat"),
    lng: real("lng"),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
    claimedByUserId: text("claimed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    lastUpdatedBy: text("last_updated_by"),
    lastUpdatedAt: integer("last_updated_at", { mode: "timestamp_ms" }),
    embedding: blob("embedding"),
  },
  (t) => [
    uniqueIndex("companies_slug_idx").on(t.slug),
    index("companies_sector_idx").on(t.sector),
    index("companies_stage_idx").on(t.stage),
    index("companies_claimed_by_idx").on(t.claimedByUserId),
  ],
);

export const companyLocations = sqliteTable(
  "company_locations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    county: text("county"),
    city: text("city"),
  },
  (t) => [
    index("company_locations_company_idx").on(t.companyId),
    index("company_locations_county_idx").on(t.county),
  ],
);

export const companyJobs = sqliteTable(
  "company_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    postedAt: integer("posted_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("company_jobs_company_idx").on(t.companyId)],
);

export const companyPhotos = sqliteTable(
  "company_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    caption: text("caption"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("company_photos_company_idx").on(t.companyId)],
);

// ─── Founder passports ───────────────────────────────────────────────

export const founderPassports = sqliteTable(
  "founder_passports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("fp")),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    county: text("county"),
    city: text("city"),
    stage: text("stage"),
    industry: text("industry"),
    communitiesJson: text("communities_json"),
    goal: text("goal"),
    urgency: text("urgency"),
    businessSize: text("business_size"),
    needsJson: text("needs_json"),
    constraintsJson: text("constraints_json"),
    websiteUrl: text("website_url"),
    enrichedAt: integer("enriched_at", { mode: "timestamp_ms" }),
    enrichmentSource: text("enrichment_source"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(now),
  },
  (t) => [index("founder_passports_user_idx").on(t.userId)],
);

// ─── Recommendations (cached) ────────────────────────────────────────

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("rec")),
    passportId: text("passport_id")
      .notNull()
      .references(() => founderPassports.id, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    score: real("score").notNull(),
    reasonsJson: text("reasons_json"),
    actionText: text("action_text"),
    bucket: text("bucket"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(now),
  },
  (t) => [index("recommendations_passport_idx").on(t.passportId)],
);

// ─── Ownership verification + audit ──────────────────────────────────

export const businessOwnershipSubmissions = sqliteTable(
  "business_ownership_submissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("bos")),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).$defaultFn(now),
    status: text("status").default("pending").notNull(),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNotes: text("review_notes"),
  },
  (t) => [
    index("bos_user_idx").on(t.userId),
    index("bos_company_idx").on(t.companyId),
    index("bos_status_idx").on(t.status),
  ],
);

export const profileUpdates = sqliteTable(
  "profile_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    submissionId: text("submission_id").references(
      () => businessOwnershipSubmissions.id,
      { onDelete: "set null" },
    ),
    patchJson: text("patch_json").notNull(),
    appliedAt: integer("applied_at", { mode: "timestamp_ms" }).$defaultFn(now),
    reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [index("profile_updates_company_idx").on(t.companyId)],
);
