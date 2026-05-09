"use client";

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
import { authClient } from "@/lib/auth-client";

const Schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email(),
  phone: z.string().optional(),
});
type Values = z.infer<typeof Schema>;

export function ProfileSection({
  initial,
}: {
  initial: { name: string; email: string };
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const tz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "—";

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { name: initial.name, email: initial.email, phone: "" },
  });

  async function onSubmit(values: Values) {
    setStatus("saving");
    setError(null);
    try {
      // Display name update (Better Auth's updateUser).
      if (values.name !== initial.name) {
        const r = await authClient.updateUser({ name: values.name });
        if (r.error) {
          setError(r.error.message ?? "Save failed.");
          setStatus("error");
          return;
        }
      }
      // Email change triggers re-verify via Better Auth's changeEmail.
      if (values.email !== initial.email) {
        const r = await authClient.changeEmail({ newEmail: values.email });
        if (r.error) {
          setError(r.error.message ?? "Email change failed.");
          setStatus("error");
          return;
        }
      }
      setStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setStatus("error");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <p className="text-xs text-ink-3">
                Changing requires re-verification.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="add a number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <p className="text-sm font-medium">Time zone</p>
          <p className="mt-2 rounded-tile border border-topo bg-paper-2 px-3 py-2 font-mono text-sm text-ink-2">
            {tz}
          </p>
        </div>
        {error ? (
          <p className="sm:col-span-2 rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="sm:col-span-2 rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
            ✓ Saved.
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === "saving"}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </Form>
  );
}
