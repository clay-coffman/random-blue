"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof Schema>;

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const errParam = params.get("error");
  const [serverError, setServerError] = useState<string | null>(
    errParam === "forbidden" ? "You don't have access to that page." : null,
  );
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      // Anti-enumeration: Better Auth's send-verification-otp with
      // disableSignUp:true returns success for unknown emails too
      // (without actually sending mail). We always route to
      // /sign-in/verify; an unknown email simply never receives a
      // code and signIn.emailOtp returns INVALID_OTP at the verify
      // step — same response a wrong-code attempt would get.
      await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "sign-in",
      });
      const sp = new URLSearchParams();
      sp.set("email", values.email);
      if (next && next !== "/") sp.set("next", next);
      router.push(`/sign-in/verify?${sp.toString()}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Network error. Please retry.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      kicker="Welcome back"
      title="Log in to Atlas."
      lede="Enter your email. We'll send a 6-digit code."
      footer={
        <AuthFooterLink
          prefix="No account yet?"
          href="/sign-up"
          label="Sign up"
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
            {submitting ? "Sending code…" : "Send sign-in code →"}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
