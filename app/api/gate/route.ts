import { NextResponse } from "next/server";
import {
  SITE_GATE_COOKIE,
  SITE_GATE_COOKIE_MAX_AGE,
  sha256Hex,
  siteGatePassword,
  timingSafeEqual,
} from "@/lib/site-gate";

export const dynamic = "force-dynamic";

function safeRedirectTarget(raw: string | null): string {
  if (!raw) return "/";
  // Same-origin only — reject absolute URLs, protocol-relative URLs,
  // and anything that doesn't start with a single "/".
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.startsWith("/gate") || raw.startsWith("/api/gate")) return "/";
  return raw;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = safeRedirectTarget(String(form.get("next") ?? "/"));

  const sitePassword = siteGatePassword();
  // If gate is unset at the time of submit, just redirect to next —
  // someone landed on /gate with no active gate.
  if (!sitePassword) {
    return NextResponse.redirect(new URL(next, req.url), { status: 303 });
  }

  if (!timingSafeEqual(password, sitePassword)) {
    const back = new URL("/gate", req.url);
    back.searchParams.set("next", next);
    back.searchParams.set("bad", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  // Success: cookie value is sha256(SITE_PASSWORD). Rotating the
  // password invalidates every existing cookie automatically.
  const cookieValue = await sha256Hex(sitePassword);
  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(SITE_GATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SITE_GATE_COOKIE_MAX_AGE,
  });
  return res;
}
