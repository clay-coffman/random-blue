import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { getCookiePrefix } from "@/lib/auth-cookie";
import { safeNext } from "@/lib/url";

// Edge-cheap presence check. Pages and API route handlers re-verify
// with `auth.api.getSession({ headers })` for role-aware decisions —
// defense-in-depth per the brief's pitfalls list.
export default function middleware(req: NextRequest) {
  // Cloudflare sets x-forwarded-proto to the original scheme; the
  // nextUrl.protocol fallback covers local dev where the header is
  // absent.
  const proto =
    req.headers.get("x-forwarded-proto") ??
    req.nextUrl.protocol.replace(":", "");
  const session = getSessionCookie(req, {
    cookiePrefix: getCookiePrefix(proto === "https"),
  });

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
