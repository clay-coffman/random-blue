// HMAC-SHA256-signed compact tokens for one-click email actions
// (unsubscribe, change cadence). Format: `<payload>.<sig>` where
// `payload` is base64url-encoded JSON `{ k, id, exp? }`. The verifier
// recomputes the signature with `BETTER_AUTH_SECRET` and rejects on
// mismatch or expiry.
//
// This is *not* a session — it grants exactly one capability (e.g.
// "disable saved-search ssX"), no PII, no cookie. Stateless on
// purpose so that a recipient who lost their account can still stop
// the emails.

import { env } from "./cf";

type Payload = {
  k: string; // capability key, e.g. "ss-unsub"
  id: string; // resource id (e.g. saved_search id)
  /** ms epoch; defaults to 30 days from issue. */
  exp?: number;
};

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function b64urlEncode(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const norm = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(norm);
  // Allocate a fresh ArrayBuffer (not SharedArrayBuffer) so the
  // Uint8Array satisfies BufferSource. crypto.subtle.verify() rejects
  // ArrayBufferView<ArrayBufferLike> in TS even though the runtime
  // accepts both.
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = env().BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signToken(p: Payload): Promise<string> {
  const sealed: Payload = {
    ...p,
    exp: p.exp ?? Date.now() + DEFAULT_TTL_MS,
  };
  const payload = JSON.stringify(sealed);
  const enc = new TextEncoder().encode(payload);
  const payloadB64 = b64urlEncode(enc);
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc);
  return `${payloadB64}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(
  token: string,
  expectedKey: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return { ok: false, reason: "malformed" };
  const payloadBytes = b64urlDecode(payloadB64);
  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Payload;
  } catch {
    return { ok: false, reason: "decode_failed" };
  }
  const key = await hmacKey();
  // Verify against the *original* bytes, not a re-stringified payload —
  // re-serialization could re-order keys and break the signature.
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sigB64),
    payloadBytes,
  );
  if (!valid) return { ok: false, reason: "bad_signature" };
  if (payload.k !== expectedKey) return { ok: false, reason: "wrong_capability" };
  if (payload.exp && Date.now() > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, id: payload.id };
}
