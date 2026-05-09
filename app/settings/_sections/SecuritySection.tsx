"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export function SecuritySection() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await authClient.listSessions();
        if (r.data) setSessions(r.data as unknown as SessionRow[]);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function revokeOthers() {
    try {
      await authClient.revokeOtherSessions();
      const r = await authClient.listSessions();
      if (r.data) setSessions(r.data as unknown as SessionRow[]);
    } catch {
      // ignore
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-tile border-[1.5px] border-topo bg-paper-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Sign-in
        </p>
        <p className="mt-1 text-sm">
          Atlas signs you in with a 6-digit code emailed to{" "}
          <span className="font-medium">your address on file</span>. There&rsquo;s
          no password to remember or change.
        </p>
      </div>

      <div className="rounded-tile border-[1.5px] border-topo bg-paper-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Active sessions
        </p>
        <p className="mt-1 text-sm">
          {sessions.length} active session{sessions.length === 1 ? "" : "s"}.
        </p>
        {sessions.length > 1 ? (
          <button
            type="button"
            onClick={revokeOthers}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-4 py-2 text-sm"
          >
            Sign out other sessions →
          </button>
        ) : null}
      </div>

      <div className="rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 sm:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          Two-factor &amp; connected accounts
        </p>
        <p className="mt-1 text-sm text-ink-3">
          Authenticator-app 2FA and Google account linking land in Phase 5.
        </p>
      </div>
    </div>
  );
}
