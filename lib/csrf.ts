// Same-origin guard for cookie-authenticated state-changing requests.
//
// Browser-issued requests carry Sec-Fetch-Site (Chromium/Firefox/Safari
// for years) and/or Origin. A forged cross-site POST cannot lie about
// either header — they're set by the user agent, not page script.
// Server-to-server callers (curl, our own CLI/MCP) authenticate with
// X-Atlas-Admin-Token instead and bypass this check entirely; see
// authorizeWrite() in auth-utils.ts.
export function isSameOriginRequest(req: Request): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) {
    // "none" = user typed the URL or used a bookmark.
    // "same-origin" = page script on the same origin.
    return fetchSite === "same-origin" || fetchSite === "none";
  }

  // Older browsers / proxies that strip Sec-Fetch-* fall through to
  // the Origin check.
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
