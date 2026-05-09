"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { authClient } from "@/lib/auth-client";
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
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(128, "Password is too long"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

type FormValues = z.infer<typeof Schema>;

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const label = ["weak", "fair", "good", "strong"][score];
  return { score: score as 0 | 1 | 2 | 3, label };
}

export default function SignUpAccountPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = Role.safeParse(params.get("role") ?? "founder").data ?? "founder";
  const next = safeNext(params.get("next"), "");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", password: "", terms: false as never },
  });

  const password = form.watch("password");
  const strength = passwordStrength(password);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        role,
      });
      if (result.error) {
        setServerError(result.error.message ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      // emailOTP plugin's sendVerificationOnSignUp: true automatically
      // dispatches the verification code on signup. No extra send needed.
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
                  <Input placeholder="Priya Mehta" {...field} />
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                {password ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-pill bg-stone">
                      <div
                        className={`h-full transition-all ${
                          strength.score >= 3
                            ? "w-full bg-sage"
                            : strength.score === 2
                              ? "w-2/3 bg-ember"
                              : strength.score === 1
                                ? "w-1/3 bg-ember"
                                : "w-1/6 bg-danger"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      {strength.label}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-3">
                    12+ characters. Mix letters, numbers, and a symbol.
                  </p>
                )}
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
