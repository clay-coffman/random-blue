import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Edge-cheap presence check. Pages and API route handlers re-verify
// with `auth.api.getSession({ headers })` for role-aware decisions —
// defense-in-depth per the brief's pitfalls list.
export default function middleware(req: NextRequest) {
  const session = getSessionCookie(req);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
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
