import { z } from "zod";

// Patch shape for the public-profile editor + machine PATCH. All
// fields optional — the route only writes what the caller sends.
// `verification_status` is admin/machine-only and not exposed in the
// owner whitelist.
export const InvestorPublicPatchSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, and hyphens only.")
    .optional(),
  display_name: z.string().min(1).max(120).optional(),
  bio: z.string().max(2000).nullable().optional(),
  tagline: z.string().max(200).nullable().optional(),
  website: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  linkedin: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  // Admin/machine path only — owner edits ignore this.
  verification_status: z.enum(["unverified", "verified"]).optional(),
});
export type InvestorPublicPatch = z.infer<typeof InvestorPublicPatchSchema>;
