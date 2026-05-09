import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import * as authSchema from "@/db/schema.auth";
import { getCookiePrefix } from "@/lib/auth-cookie";
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

  // Dev DX: when AUTH_SKIP_OTP=true in .dev.vars, drop the OTP plugin
  // and disable the email-verification gate so signups land
  // authenticated immediately. NEVER set in production — see CLAUDE.md
  // § Local authentication testing.
  const skipOtp = env?.AUTH_SKIP_OTP === "true";

  const baseURL =
    env?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? undefined;
  // __Host- prefix requires Secure + Path=/ + no Domain. Browsers reject
  // it over plain HTTP, so fall back to a plain prefix in dev.
  const isHttps = baseURL?.startsWith("https://") ?? false;
  // URL-parsed hostname check — substring `.includes("localhost")`
  // would match `https://localhost.evil.com`. Malformed URLs throw and
  // are treated as non-localhost (the boot-check below will refuse).
  let isLocalhost = false;
  if (baseURL) {
    try {
      const h = new URL(baseURL).hostname;
      isLocalhost = h === "localhost" || h === "127.0.0.1" || h === "::1";
    } catch {
      // Malformed URL — leave isLocalhost=false so the boot-check below
      // refuses, instead of silently treating it as dev.
    }
  }

  // Fail loud if a real Worker boots without a usable BETTER_AUTH_URL.
  // The check fires when the env binding exists (i.e. real runtime, not
  // codegen) AND the URL is missing OR not https-or-localhost. Without
  // this, the cookie silently downgrades to the plain `atlas` prefix
  // and drops Secure, defeating the __Host- protection.
  if (env && !isHttps && !isLocalhost) {
    throw new Error(
      `BETTER_AUTH_URL must be set to an https:// URL in production (or localhost in dev). Got: ${baseURL ?? "<unset>"}`,
    );
  }

  return betterAuth({
    baseURL,
    secret:
      env?.BETTER_AUTH_SECRET ??
      process.env.BETTER_AUTH_SECRET ??
      undefined,
    // In dev (localhost), accept any localhost origin so worktrees on
    // rotating ports (3000+N) don't 403 when BETTER_AUTH_URL is stale.
    // Production keeps the strict single-origin allowlist.
    trustedOrigins: isLocalhost
      ? (request?: Request) => {
          const origin = request?.headers.get("origin");
          if (!origin) return [];
          try {
            const h = new URL(origin).hostname;
            if (h === "localhost" || h === "127.0.0.1" || h === "::1") {
              return [origin];
            }
          } catch {
            // malformed origin — ignore
          }
          return [];
        }
      : baseURL
        ? [baseURL]
        : [],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !skipOtp,
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
    plugins: skipOtp
      ? []
      : [
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
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // sliding refresh once/day
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      // __Host- prefix in prod prevents any sibling host on utah.gov
      // from setting the session cookie. The prefix needs Secure +
      // Path=/ + no Domain, all of which we configure below.
      cookiePrefix: getCookiePrefix(isHttps),
      useSecureCookies: isHttps,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
      },
      crossSubDomainCookies: { enabled: false },
      // Cloudflare strips x-forwarded-for and provides the true client
      // IP via cf-connecting-ip. Without this, rateLimit (below) keys
      // on the wrong/null IP.
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 600, max: 5 },
        "/email-otp/send-verification-otp": { window: 60, max: 3 },
        "/email-otp/verify-otp": { window: 60, max: 5 },
        "/forget-password": { window: 600, max: 3 },
        "/reset-password": { window: 600, max: 5 },
      },
    },
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
