// Open-redirect guard for `?next=...` query params. Accepts only paths
// that start with a single "/" — rejects:
//   - empty string / null / undefined
//   - external URLs ("https://evil.example/...")
//   - protocol-relative URLs ("//evil.example/...")
//   - anything else that's not a path within this app
//
// Returns `fallback` when the input is unsafe.
export function safeNext(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/")) return fallback;
  // "//evil.example" parses as a protocol-relative URL — disallow.
  if (next.startsWith("//")) return fallback;
  // "/\evil" → some browsers normalize backslashes to forward slashes.
  if (next.startsWith("/\\")) return fallback;
  return next;
}

// Strict subdomain-suffix check. `host === domain` OR `host` ends with
// "." + domain. Avoids the "evilcrew.com".endsWith("crew.com") trap.
export function isSubdomainOf(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith("." + d);
}
