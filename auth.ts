import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import * as authSchema from "@/db/schema.auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

// Self-serve roles only. goeo_admin/superadmin are gained via
// /admin/admins invites + scripts/bootstrap-superadmin.ts respectively.
const SELF_SERVE_ROLE = z.enum(["founder", "owner", "investor"]);

// Dual-mode Better Auth config. CLI codegen calls `betterAuth(...)` with
// a stub D1 (no env). Runtime calls `getAuth()` which lazily wires the
// real per-request DB + secrets via `getCloudflareContext()`.
//
// Role default flips from `'owner'` (Agent 1's stub) to `'founder'`.
// Role enum widens to founder | owner | investor | goeo_admin |
// superadmin. The first three are self-serve at signup; the last two
// are invite-only (admin invites + bootstrap-superadmin script).
function buildAuth(env?: CloudflareEnv) {
  const db = env
    ? drizzle(env.DB as unknown as D1Database)
    : drizzle({} as D1Database);

  return betterAuth({
    baseURL:
      env?.BETTER_AUTH_URL ??
      process.env.BETTER_AUTH_URL ??
      undefined,
    secret:
      env?.BETTER_AUTH_SECRET ??
      process.env.BETTER_AUTH_SECRET ??
      undefined,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
    },
    user: {
      // The DB column is `role TEXT DEFAULT 'owner' NOT NULL` (frozen by
      // Agent 1). We keep `required: true` so Better Auth always supplies
      // a value at insert time, but we set the default to 'founder' —
      // the brief's user-facing default. Sign-up forms pass the picked
      // role explicitly via `input: true`, which overrides the default.
      // The validator restricts the role enum to the three self-serve
      // values; goeo_admin and superadmin are *invite-only* (admin
      // invites + bootstrap script), so the signup endpoint must reject
      // any client trying to POST `{role: "superadmin"}`.
      additionalFields: {
        role: {
          type: "string",
          required: true,
          defaultValue: "founder",
          input: true,
          validator: {
            input: SELF_SERVE_ROLE,
          },
        },
      },
      changeEmail: { enabled: true },
      deleteUser: {
        enabled: true,
        // No password re-prompt for the demo build — the wireframe's
        // confirm dialog is the safety net.
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600, // 10 minutes
        sendVerificationOnSignUp: true,
        async sendVerificationOTP({ email, otp, type }) {
          if (type === "forget-password") {
            await sendPasswordResetEmail(email, otp);
          } else {
            // email-verification (signup) and sign-in both use the
            // verification template.
            await sendVerificationEmail(email, otp);
          }
        },
      }),
    ],
  });
}

// CLI codegen entry. `@better-auth/cli generate` imports this and
// inspects schema; no DB call happens.
export const auth = buildAuth();

// Per-isolate cached runtime instance. `getCloudflareContext()` is
// stable for the lifetime of an isolate, so we can build once and reuse.
let runtimeAuth: ReturnType<typeof buildAuth> | null = null;

export function getAuth() {
  if (runtimeAuth) return runtimeAuth;
  const { env } = getCloudflareContext();
  runtimeAuth = buildAuth(env);
  return runtimeAuth;
}
