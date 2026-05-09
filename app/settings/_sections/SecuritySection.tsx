"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const Schema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(12, "Use at least 12 characters"),
});
type Values = z.infer<typeof Schema>;

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export function SecuritySection() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [showPwForm, setShowPwForm] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

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

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: Values) {
    setStatus("saving");
    setError(null);
    try {
      const r = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (r.error) {
        setError(r.error.message ?? "Couldn't change password.");
        setStatus("error");
        return;
      }
      setStatus("saved");
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setStatus("error");
    }
  }

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
          Password
        </p>
        {showPwForm ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-2 space-y-3"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error ? (
                <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              {status === "saved" ? (
                <p className="rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
                  ✓ Updated.
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="rounded-tile border-[1.5px] border-ember bg-ember px-4 py-2 text-sm font-medium text-paper shadow-sketch disabled:opacity-60"
                >
                  {status === "saving" ? "Saving…" : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPwForm(false)}
                  className="rounded-tile border border-topo bg-paper px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <p className="mt-1 text-sm">Use a strong, 12+ character password.</p>
            <button
              type="button"
              onClick={() => setShowPwForm(true)}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-4 py-2 text-sm"
            >
              Change →
            </button>
          </>
        )}
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
