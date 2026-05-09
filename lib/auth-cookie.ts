// Single source of truth for the session cookie prefix. auth.ts
// decides at boot from BETTER_AUTH_URL; middleware.ts derives it
// per request from x-forwarded-proto. Both must agree or the
// middleware reads the wrong cookie name and bounces every
// authenticated user to /sign-in.
//
// __Host- requires Secure + Path=/ + no Domain, which browsers
// only accept over HTTPS. Plain "atlas" in dev keeps cookies
// working over http://localhost.
export function getCookiePrefix(isHttps: boolean): string {
  return isHttps ? "__Host-atlas" : "atlas";
}
