import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getCookiePrefix } from "@/lib/auth-cookie";
import { safeNext } from "@/lib/url";
import {
  SITE_GATE_COOKIE,
  isGateAllowed,
  sha256Hex,
  siteGatePassword,
  timingSafeEqual,
} from "@/lib/site-gate";

// Routes that require an authenticated Better Auth session. Pages and
// API route handlers re-verify with `auth.api.getSession({ headers })`
// for role-aware decisions — defense-in-depth per the brief.
const AUTH_REQUIRED_PATTERNS: RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/settings$/,
  /^\/me(\/|$)/,
  /^\/companies\/[^/]+\/claim$/,
  /^\/companies\/[^/]+\/edit$/,
];

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Pre-launch site-wide password gate. Active only when the
  //    `SITE_PASSWORD` Workers secret is set; drop the secret +
  //    redeploy to disable for a public demo. Cookie value is the
  //    SHA-256 hex of the current password — rotating SITE_PASSWORD
  //    invalidates every existing cookie automatically.
  //
  //    Caveat: Cloudflare's ASSETS binding serves /public/* (e.g.
  //    /llms.txt, /AGENTS.md, /favicon.ico) BEFORE middleware runs,
  //    so those paths are not gated. The actual app surfaces (every
  //    Next route + every API handler) are.
  const sitePassword = siteGatePassword();
  if (sitePassword && !isGateAllowed(pathname)) {
    const cookie = req.cookies.get(SITE_GATE_COOKIE)?.value ?? "";
    const expected = await sha256Hex(sitePassword);
    if (!cookie || !timingSafeEqual(cookie, expected)) {
      const url = req.nextUrl.clone();
      url.pathname = "/gate";
      // safeNext sanitizes the same way the post-submit redirect
      // does — defense-in-depth so a bouncy URL fragment can't
      // slip through if the upstream pathname was unusual.
      url.searchParams.set("next", safeNext(pathname + search));
      return NextResponse.redirect(url);
    }
  }

  // 2) Better Auth session gate for protected routes. Cloudflare sets
  //    x-forwarded-proto to the original scheme; the nextUrl.protocol
  //    fallback covers local dev where the header is absent. The
  //    cookiePrefix here MUST match auth.ts:advanced.cookiePrefix or
  //    we read the wrong cookie and bounce every authenticated user
  //    to /sign-in (regression #49).
  const needsAuth = AUTH_REQUIRED_PATTERNS.some((rx) => rx.test(pathname));
  if (needsAuth) {
    const proto =
      req.headers.get("x-forwarded-proto") ??
      req.nextUrl.protocol.replace(":", "");
    const session = getSessionCookie(req, {
      cookiePrefix: getCookiePrefix(proto === "https"),
    });
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      // safeNext keeps the post-login redirect within the app —
      // prevents a crafted /admin/?next=https://evil.example bounce.
      url.searchParams.set("next", safeNext(pathname + search));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next.js's internal asset paths so the
  // site-gate can redirect any unauthorized visit. Cloudflare's
  // ASSETS binding short-circuits /public/* before the Worker runs;
  // those are intentionally outside this scope.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
