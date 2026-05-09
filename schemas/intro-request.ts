import { z } from "zod";

export const IntroRequestCreateSchema = z.object({
  target: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("investor"),
      id: z.string().regex(/^inv_[a-z0-9]+$/, "Expected inv_ id."),
    }),
    z.object({
      type: z.literal("company"),
      id: z.string().regex(/^co_[a-z0-9]+$/, "Expected co_ id."),
    }),
  ]),
  message_text: z.string().min(20).max(2000),
});
export type IntroRequestCreate = z.infer<typeof IntroRequestCreateSchema>;

export const IntroRequestPatchSchema = z.object({
  status: z.enum(["accepted", "declined", "introduced"]),
  admin_notes: z.string().max(2000).nullable().optional(),
});
export type IntroRequestPatch = z.infer<typeof IntroRequestPatchSchema>;
