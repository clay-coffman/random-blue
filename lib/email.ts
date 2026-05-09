import { Resend } from "resend";
import { env } from "./cf";

// TODO(phase-5b): flip to `noreply@startup.utah.gov` once GOEO
// verifies that domain in Resend (DNS records). Until then we send
// from `startupstateatlas.dev` — a domain we own end-to-end, verified
// via Resend's DKIM + SPF + DMARC records on Cloudflare DNS. This
// works for any recipient (Resend's `onboarding@resend.dev` only
// delivers to the account holder's address).
const FROM = "Startup State Atlas <noreply@startupstateatlas.dev>";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );
}

// Defense-in-depth for header injection. Display names are validated
// at the schema boundary (max 120 chars, no length-by-line constraint),
// so a malicious actor could embed `\r\n` and inject extra headers if
// the downstream mailer ever concatenated raw. Stripping CRLF before
// the subject interpolation is cheap.
function stripCrlf(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

function paragraphs(s: string): string {
  return s
    .split(/\n+/)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

function publicOrigin(): string {
  // Used to render absolute links in outbound mail. Override via the
  // PUBLIC_BASE_URL Worker secret when a non-prod deploy needs it;
  // otherwise we ship absolute startupstateatlas.dev links by default
  // since that is the live deploy target.
  const e = env() as unknown as { PUBLIC_BASE_URL?: string };
  return e.PUBLIC_BASE_URL ?? "https://startupstateatlas.dev";
}

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

export async function sendSavedSearchAlertEmail(opts: {
  to: string;
  searchName: string;
  manageUrl: string;
  unsubscribeUrl: string;
  newCompanies: {
    name: string;
    slug: string;
    sector: string | null;
    city: string | null;
    summary: string | null;
  }[];
}) {
  const { to, searchName, manageUrl, unsubscribeUrl, newCompanies } = opts;
  const baseUrl = (env().BETTER_AUTH_URL ?? "https://startupstateatlas.dev").replace(
    /\/$/,
    "",
  );
  const items = newCompanies
    .map((c) => {
      const meta = [c.sector, c.city].filter(Boolean).join(" · ");
      const desc = c.summary ? `<br><span style="color:#555">${escapeHtml(c.summary)}</span>` : "";
      return `<li style="margin:0 0 12px">
        <a href="${baseUrl}/companies/${encodeURIComponent(c.slug)}" style="font-weight:600;color:#c2410c;text-decoration:none">${escapeHtml(c.name)}</a>
        ${meta ? `<br><span style="color:#777;font-size:13px">${escapeHtml(meta)}</span>` : ""}
        ${desc}
      </li>`;
    })
    .join("");
  const count = newCompanies.length;
  const subject = `${count} new ${count === 1 ? "company matches" : "companies match"} "${searchName}"`;
  await send(
    to,
    subject,
    `<h2 style="font-family:Georgia,serif">New matches for ${escapeHtml(searchName)}</h2>
     <p>${count} new ${count === 1 ? "company matches" : "companies match"} this saved search since the last run.</p>
     <ul style="padding-left:18px;font-family:Helvetica,Arial,sans-serif">${items}</ul>
     <p style="margin-top:24px;font-size:12px;color:#777">
       <a href="${manageUrl}" style="color:#777">Manage saved searches</a>
       &nbsp;·&nbsp;
       <a href="${unsubscribeUrl}" style="color:#777">Stop these alerts</a>
     </p>`,
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

// ─── Agent 8: intro-request emails ──────────────────────────────────

export async function sendIntroPendingEmail(args: {
  to: string;
  name: string;
  targetName: string;
}) {
  await send(
    args.to,
    "Your intro request is queued",
    `<h2>Intro request received</h2>
     <p>Hi ${escapeHtml(args.name)},</p>
     <p>Your intro request to <strong>${escapeHtml(stripCrlf(args.targetName))}</strong> has been received and is queued for GOEO review.</p>
     <p>We'll email you when there's an update — usually within a few business days.</p>
     <p>— Utah GOED</p>`,
  );
}

export async function sendIntroAcceptedEmail(args: {
  to: string;
  recipientName: string;
  otherName: string;
  otherEmail: string;
  otherProfileUrl: string | null;
  messageText: string;
  adminNote: string | null;
  reviewerName: string;
}) {
  const profileLink = args.otherProfileUrl
    ? `<p>Profile: <a href="${publicOrigin()}${escapeHtml(args.otherProfileUrl)}">${publicOrigin()}${escapeHtml(args.otherProfileUrl)}</a></p>`
    : "";
  const noteBlock = args.adminNote
    ? `<h3>Note from GOEO</h3>${paragraphs(args.adminNote)}`
    : "";
  await send(
    args.to,
    `Intro accepted: ${stripCrlf(args.otherName)}`,
    `<h2>GOEO has connected you</h2>
     <p>Hi ${escapeHtml(args.recipientName)},</p>
     <p>The GOEO team reviewed and accepted an intro request between you and <strong>${escapeHtml(args.otherName)}</strong>.</p>
     <p>Reach out directly:</p>
     <ul>
       <li>Name: ${escapeHtml(args.otherName)}</li>
       <li>Email: <a href="mailto:${escapeHtml(args.otherEmail)}">${escapeHtml(args.otherEmail)}</a></li>
     </ul>
     ${profileLink}
     <h3>Original request message</h3>
     ${paragraphs(args.messageText)}
     ${noteBlock}
     <p>— Reviewed by ${escapeHtml(args.reviewerName)}, Utah GOED</p>`,
  );
}

export async function sendIntroDeclinedEmail(args: {
  to: string;
  name: string;
  targetName: string;
  adminNote: string | null;
  reviewerName: string;
}) {
  const noteBlock = args.adminNote
    ? `<h3>Note from GOEO</h3>${paragraphs(args.adminNote)}`
    : "";
  await send(
    args.to,
    "Update on your intro request",
    `<h2>Intro request update</h2>
     <p>Hi ${escapeHtml(args.name)},</p>
     <p>Your intro request to <strong>${escapeHtml(args.targetName)}</strong> wasn't a fit at this time. The GOEO team won't be making this connection.</p>
     ${noteBlock}
     <p>You can submit other requests through the directory.</p>
     <p>— ${escapeHtml(args.reviewerName)}, Utah GOED</p>`,
  );
}

// ─── Business-ownership claim decision emails ───────────────────────

type ClaimDecision = "approved" | "rejected" | "needs_more_info";

export async function sendClaimDecisionEmail(args: {
  to: string;
  status: ClaimDecision;
  companyName: string;
  companySlug: string;
  notes?: string | null;
}) {
  const origin = publicOrigin();
  const safeName = escapeHtml(stripCrlf(args.companyName));
  const editUrl = `${origin}/companies/${encodeURIComponent(args.companySlug)}/edit`;
  const claimUrl = `${origin}/companies/${encodeURIComponent(args.companySlug)}/claim`;
  const notesBlock = args.notes
    ? `<h3>Note from GOEO</h3>${paragraphs(args.notes)}`
    : "";

  if (args.status === "approved") {
    await send(
      args.to,
      `${stripCrlf(args.companyName)} is yours on Atlas`,
      `<h2>You&rsquo;re verified</h2>
       <p>GOEO reviewed and approved your claim of <strong>${safeName}</strong>. You can now edit the public profile.</p>
       <p><a href="${editUrl}" style="display:inline-block;padding:10px 16px;background:#c2410c;color:#fff;text-decoration:none;border-radius:6px">Edit your profile →</a></p>
       <p>Changes you save publish to the map, the public profile, the JSON feed, and the Markdown export immediately.</p>
       ${notesBlock}
       <p>— Utah GOED</p>`,
    );
    return;
  }
  if (args.status === "needs_more_info") {
    await send(
      args.to,
      `One more thing for your ${stripCrlf(args.companyName)} claim`,
      `<h2>We need a bit more</h2>
       <p>Thanks for your claim of <strong>${safeName}</strong>. Before GOEO can verify it, we need an additional document or clarification.</p>
       ${notesBlock}
       <p><a href="${claimUrl}" style="display:inline-block;padding:10px 16px;background:#c2410c;color:#fff;text-decoration:none;border-radius:6px">Re-upload a document →</a></p>
       <p>— Utah GOED</p>`,
    );
    return;
  }
  // rejected
  await send(
    args.to,
    `Update on your ${stripCrlf(args.companyName)} claim`,
    `<h2>Claim not approved</h2>
     <p>We weren&rsquo;t able to verify your claim of <strong>${safeName}</strong> with the document provided.</p>
     ${notesBlock}
     <p>If you believe this is an error, reply to this email or write to <a href="mailto:atlas@goed.utah.gov">atlas@goed.utah.gov</a> and we&rsquo;ll take another look.</p>
     <p>— Utah GOED</p>`,
  );
}

export async function sendIntroIntroducedEmail(args: {
  to: string;
  name: string;
  targetName: string;
  adminNote: string | null;
  reviewerName: string;
}) {
  const noteBlock = args.adminNote
    ? `<h3>Note from GOEO</h3>${paragraphs(args.adminNote)}`
    : "";
  await send(
    args.to,
    `Intro made: ${stripCrlf(args.targetName)}`,
    `<h2>Introduction made</h2>
     <p>Hi ${escapeHtml(args.name)},</p>
     <p>The GOEO team has introduced you to <strong>${escapeHtml(args.targetName)}</strong> directly. Watch for a separate email from us connecting both parties.</p>
     ${noteBlock}
     <p>— ${escapeHtml(args.reviewerName)}, Utah GOED</p>`,
  );
}
