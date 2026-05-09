// Pre-launch site-wide password gate. Active only when the
// `SITE_PASSWORD` Workers secret is set; drop the secret + redeploy
// to disable the gate for a public demo.
//
// Cookie design: value is the SHA-256 hex of the current SITE_PASSWORD.
// Stateless, no session store. Rotating the password invalidates every
// existing cookie automatically.

export const SITE_GATE_COOKIE = "atlas_gate";
export const SITE_GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** SHA-256(input) as lowercase hex. Web Crypto, works on Workers. */
export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string compare so cookie validation doesn't leak by timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return acc === 0;
}

/** Read SITE_PASSWORD from runtime env. Returns null if unset/empty —
 *  callers should treat null as "gate is disabled". */
export function siteGatePassword(): string | null {
  // process.env on Workers (via OpenNext) carries Worker secrets at
  // runtime. This is also the path middleware uses, where the
  // Cloudflare context isn't always available.
  const v = process.env.SITE_PASSWORD;
  return v && v.length > 0 ? v : null;
}

/**
 * Decide whether a path should bypass the gate. The gate page itself,
 * the gate-submit API, and Next-internal asset routes have to be
 * reachable while the gate is active or we'd loop. Static assets are
 * served by the Workers `ASSETS` binding before middleware runs, but
 * we still allow `/_next/*` and a couple of Cloudflare paths defensively.
 */
export function isGateAllowed(pathname: string): boolean {
  if (pathname === "/gate") return true;
  if (pathname.startsWith("/api/gate")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return false;
}
