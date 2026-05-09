"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { safeNext } from "@/lib/url";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const Role = z.enum(["founder", "owner", "investor"]);

const Schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

type FormValues = z.infer<typeof Schema>;

export default function SignUpAccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountForm />
    </Suspense>
  );
}

function AccountForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = Role.safeParse(params.get("role") ?? "founder").data ?? "founder";
  const next = safeNext(params.get("next"), "");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", terms: false as never },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/start-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          role,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: { code?: string; message?: string } }
          | null;
        setServerError(
          body?.error?.message ?? "Couldn't start signup. Try again.",
        );
        setSubmitting(false);
        return;
      }
      const sp = new URLSearchParams();
      sp.set("email", values.email);
      sp.set("role", role);
      if (next) sp.set("next", next);
      router.push(`/sign-up/verify?${sp.toString()}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Network error. Please retry.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      kicker={`${role.toUpperCase()} · step 2 of 3`}
      title="Create your account."
      steps={[
        { label: "Role", state: "done" },
        { label: "Account", state: "current" },
        { label: "Verify", state: "pending" },
      ]}
      footer={
        <AuthFooterLink
          prefix="Already have an account?"
          href="/sign-in"
          label="Log in"
        />
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
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
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-ink-3">
                  We&rsquo;ll send a 6-digit code here.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-start gap-2 text-sm leading-snug text-ink-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <span>
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="text-ember underline-offset-4 hover:underline"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-ember underline-offset-4 hover:underline"
                    >
                      Privacy
                    </a>
                    .
                  </span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError ? (
            <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover disabled:opacity-60"
          >
            {submitting ? "Sending code…" : "Send verification code →"}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
