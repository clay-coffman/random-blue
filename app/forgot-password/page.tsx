"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell, AuthFooterLink } from "@/components/auth/AuthShell";
import { authClient } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const Schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof Schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    // Always show the same confirmation regardless of whether the email
    // is on file (anti-enumeration). Better Auth's emailOTP reset flow
    // returns success either way.
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "forget-password",
      });
    } catch {
      // Swallow — generic confirmation copy is the contract.
    }
    const sp = new URLSearchParams();
    sp.set("mode", "reset");
    sp.set("email", values.email);
    router.push(`/login/sent?${sp.toString()}`);
  }

  return (
    <AuthShell
      kicker="Reset password"
      title="Forgot your password?"
      lede="Enter your email. If we have an account, we'll send a 6-digit code."
      footer={
        <AuthFooterLink
          prefix="Remembered it?"
          href="/sign-in"
          label="Back to log in"
        />
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-ink-3">
            We&rsquo;ll show the same confirmation screen whether or not your
            email is on file.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset code →"}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
