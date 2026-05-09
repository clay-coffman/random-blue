import { Resend } from "resend";
import { env } from "./cf";

// TODO(phase-5b): flip to `noreply@startup.utah.gov` once GOEO
// verifies that domain in Resend (DNS records). Until then we send
// from `startupstateatlas.dev` — a domain we own end-to-end, verified
// via Resend's DKIM + SPF + DMARC records on Cloudflare DNS. This
// works for any recipient (Resend's `onboarding@resend.dev` only
// delivers to the account holder's address).
const FROM = "Startup State Atlas <noreply@startupstateatlas.dev>";

async function send(to: string, subject: string, html: string) {
  // Dev: if MAILPIT_URL is set, POST to mailpit's HTTP send API. Mailpit
  // serves both the send endpoint and the inbox UI on the same port
  // (default 8025), so MAILPIT_URL=http://localhost:8025 also tells the
  // operator where to read messages. NEVER set MAILPIT_URL in production.
  // See CLAUDE.md § Local authentication testing.
  const mailpitUrl = env().MAILPIT_URL;
  if (mailpitUrl) {
    await fetch(`${mailpitUrl}/api/v1/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: "noreply@startup-state-atlas.local" },
        To: [{ Email: to }],
        Subject: subject,
        HTML: html,
      }),
    });
    return;
  }
  const apiKey = env().RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback — keeps OTP flows usable without Resend or mailpit.
    // The 6-digit code is the only thing operators actually need to
    // grab in dev; the full HTML body is logged for completeness.
    console.log(
      `\n[email:dev] to=${to}\n  subject: ${subject}\n  body: ${html}\n`,
    );
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(email: string, otp: string) {
  await send(
    email,
    "Verify your Startup State Atlas account",
    `<h2>Welcome to Atlas</h2>
     <p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p>
     <p>It expires in 10 minutes.</p>`,
  );
}

export async function sendPasswordResetEmail(email: string, otp: string) {
  await send(
    email,
    "Reset your Startup State Atlas password",
    `<h2>Password reset</h2>
     <p>Your reset code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p>
     <p>It expires in 10 minutes. If you didn't request a reset, ignore this email.</p>`,
  );
}

export async function sendAdminInviteEmail(email: string, link: string) {
  await send(
    email,
    "You've been invited as a GOEO admin on Startup State Atlas",
    `<h2>GOEO admin invite</h2>
     <p>You've been invited to administer Startup State Atlas.</p>
     <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#c2410c;color:#fff;text-decoration:none;border-radius:6px">Accept your invite</a></p>
     <p>Or open: ${link}</p>
     <p>This link is single-use and expires in 7 days.</p>`,
  );
}
