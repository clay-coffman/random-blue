"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
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

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
  otp: z.string().length(6, "Enter the 6-digit code"),
  password: z.string().min(12, "Use at least 12 characters"),
});
type FormValues = z.infer<typeof Schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialEmail = params.get("email") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: initialEmail, otp: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: values.email,
        otp: values.otp,
        password: values.password,
      });
      if (result.error) {
        setServerError(result.error.message ?? "Invalid code or password.");
        setSubmitting(false);
        return;
      }
      router.push("/sign-in?next=/&reset=ok");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Reset failed. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      kicker="New password"
      title="Set a new password."
      lede="Enter the 6-digit code we emailed and your new password."
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
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>6-digit code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-ink-3">12+ characters.</p>
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
            {submitting ? "Setting password…" : "Set password →"}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
