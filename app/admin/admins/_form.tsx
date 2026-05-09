"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

const Schema = z.object({ email: z.string().email() });
type Values = z.infer<typeof Schema>;

export function InviteAdminForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setError(null);
    setSent(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      setSent(values.email);
      form.reset();
      setSubmitting(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="staff@goed.utah.gov"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-tile border-[1.5px] border-ember bg-ember px-4 py-2 text-sm font-medium text-paper shadow-sketch disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send invite"}
        </button>
        {error ? (
          <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {sent ? (
          <p className="rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
            ✓ Invite link emailed to <strong>{sent}</strong>.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
