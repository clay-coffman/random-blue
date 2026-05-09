import { NextResponse } from "next/server";
import { env } from "@/lib/cf";
import { safeNext } from "@/lib/url";
import {
  SITE_GATE_COOKIE,
  SITE_GATE_COOKIE_MAX_AGE,
  sha256Hex,
  siteGatePassword,
  timingSafeEqual,
} from "@/lib/site-gate";

export const dynamic = "force-dynamic";

// Reuse the project-wide same-origin guard so we don't reintroduce
// bypasses that `lib/url.ts` already handles (backslash-normalized
// browsers, protocol-relative `//host`, absolute URLs). Then layer on
// the gate-bounce protection so a hostile `next=/gate` can't loop.
function safeRedirectTarget(raw: string | null): string {
  const next = safeNext(raw ?? "", "/");
  if (next.startsWith("/gate") || next.startsWith("/api/gate")) return "/";
  return next;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(req: Request) {
  // Per-IP rate limit on password attempts. The gate is a single
  // line of defense for the preview deploy — without a throttle, an
  // attacker with the URL could hammer the (relatively low-entropy,
  // shared-with-reviewers) password.
  const limiter = env().GATE_LIMIT;
  if (limiter) {
    const { success } = await limiter.limit({ key: clientIp(req) });
    if (!success) {
      const back = new URL("/gate", req.url);
      back.searchParams.set("bad", "1");
      back.searchParams.set("rate", "1");
      return NextResponse.redirect(back, { status: 303 });
    }
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = safeRedirectTarget(String(form.get("next") ?? "/"));

  const sitePassword = siteGatePassword();
  // If gate is unset at the time of submit, just redirect to next —
  // someone landed on /gate with no active gate.
  if (!sitePassword) {
    return NextResponse.redirect(new URL(next, req.url), { status: 303 });
  }

  // Hash BOTH sides before comparing so the length-mismatch
  // short-circuit in `timingSafeEqual` can't be used to probe the
  // length of the actual password. Both hashes are always 64 hex
  // chars; the length-equal branch is unconditional.
  const [inputHash, expectedHash] = await Promise.all([
    sha256Hex(password),
    sha256Hex(sitePassword),
  ]);
  if (!timingSafeEqual(inputHash, expectedHash)) {
    const back = new URL("/gate", req.url);
    back.searchParams.set("next", next);
    back.searchParams.set("bad", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  // Success: cookie value is sha256(SITE_PASSWORD). Rotating the
  // password invalidates every existing cookie automatically.
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(SITE_GATE_COOKIE, expectedHash, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SITE_GATE_COOKIE_MAX_AGE,
  });
  return res;
}
