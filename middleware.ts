import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { safeNext } from "@/lib/url";

// Match the cookie prefix from auth.ts § advanced.cookiePrefix.
// Without it, Better Auth's default name ("better-auth.session_token")
// never matches the actual cookie ("atlas.session_token" /
// "__Host-atlas.session_token"), and middleware reads every authed
// request as unauth.
function cookiePrefix(req: NextRequest): string {
  return req.nextUrl.protocol === "https:" ? "__Host-atlas" : "atlas";
}

// Edge-cheap presence check. Pages and API route handlers re-verify
// with `auth.api.getSession({ headers })` for role-aware decisions —
// defense-in-depth per the brief's pitfalls list.
export default function middleware(req: NextRequest) {
  const session = getSessionCookie(req, { cookiePrefix: cookiePrefix(req) });

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    // safeNext keeps the post-login redirect within the app — prevents
    // a crafted /admin/?next=https://evil.example bounce-attack.
    url.searchParams.set(
      "next",
      safeNext(req.nextUrl.pathname + req.nextUrl.search),
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/onboarding/:path*",
    "/settings",
    "/me/:path*",
    "/companies/:slug/claim",
    "/companies/:slug/edit",
  ],
};
