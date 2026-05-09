import { headers } from "next/headers";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminInvites } from "@/db/schema";
import { getAuth } from "@/auth";
import { sha256Hex } from "@/lib/hash";
import { ScribbleDivider } from "@/components/brand";
import { AcceptInviteButton } from "./_button";

export const dynamic = "force-dynamic";

// Public route — invitee may not be signed in yet, and definitely
// isn't goeo_admin yet, so the page can't sit under /admin/*. The
// actual role-flipping POST is gated on session match against the
// invite email, in /api/v1/admin/invites/[token].
export default async function ConsumeInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getAuth().api.getSession({ headers: await headers() });

  // Look up the invite for display purposes (we still re-validate inside
  // the POST handler, so this is just informational).
  const tokenHash = await sha256Hex(token);
  const [invite] = await db()
    .select()
    .from(adminInvites)
    .where(eq(adminInvites.tokenHash, tokenHash))
    .limit(1);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-180px)] max-w-md flex-col px-4 py-16 sm:px-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
        GOEO admin invite
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {invite ? `You've been invited.` : `This invite isn't valid.`}
      </h1>
      <ScribbleDivider className="my-6" />
      {!invite ? (
        <Body>
          <p>
            The invite link is invalid or has been revoked. Ask the GOEO
            admin who invited you to resend.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-ember underline-offset-4 hover:underline"
          >
            ← Back home
          </Link>
        </Body>
      ) : invite.consumedAt ? (
        <Body tone="ok">
          <p>This invite has already been used.</p>
          <p className="text-sm text-ink-3">
            Sign in to your account and you should already have admin access.
          </p>
          <Link
            href="/sign-in?next=/admin"
            className="mt-3 inline-block text-sm text-ember underline-offset-4 hover:underline"
          >
            Sign in →
          </Link>
        </Body>
      ) : invite.expiresAt && invite.expiresAt.getTime() < Date.now() ? (
        <Body tone="warn">
          <p>This invite has expired.</p>
          <p className="text-sm text-ink-3">
            Ask the GOEO admin who invited you to send a new one.
          </p>
        </Body>
      ) : !session?.user ? (
        <Body>
          <p>
            This is a one-time invite for{" "}
            <strong className="font-mono text-sm">{invite.email}</strong>.
            Sign in or create an account with that email first; then come back
            to this link.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/sign-in?next=/invite/${token}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch"
            >
              Sign in →
            </Link>
            <Link
              href={`/sign-up?next=/invite/${token}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 py-3"
            >
              Create account
            </Link>
          </div>
        </Body>
      ) : session.user.email.toLowerCase() !==
        invite.email.toLowerCase() ? (
        <Body tone="warn">
          <p>
            You&rsquo;re signed in as{" "}
            <strong className="font-mono text-sm">{session.user.email}</strong>
            , but this invite is for{" "}
            <strong className="font-mono text-sm">{invite.email}</strong>.
          </p>
          <p className="text-sm text-ink-3">
            Sign out and sign in with that email to accept.
          </p>
        </Body>
      ) : (
        <Body>
          <p>
            You&rsquo;re signed in as{" "}
            <strong className="font-mono text-sm">{session.user.email}</strong>
            . Accepting will give you GOEO admin access — you&rsquo;ll be able
            to review claims, edit company profiles, and manage resources.
          </p>
          <AcceptInviteButton token={token} />
          <p className="text-xs text-ink-3">
            Single-use link · expires{" "}
            {invite.expiresAt
              ? new Date(invite.expiresAt).toLocaleString()
              : "—"}
          </p>
        </Body>
      )}
    </section>
  );
}

function Body({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "ok" | "warn";
}) {
  const cls =
    tone === "warn"
      ? "rounded-tile border-[1.5px] border-danger bg-paper-2 p-5 text-ink-2 space-y-3"
      : tone === "ok"
        ? "rounded-tile border-[1.5px] border-sage bg-sage-tint p-5 text-ink-2 space-y-3"
        : "rounded-tile border-[1.5px] border-topo bg-paper-2 p-5 text-ink-2 space-y-3";
  return <div className={cls}>{children}</div>;
}
