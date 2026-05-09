"use client";

import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof Schema>;

export default function SignInPage() {
  // useSearchParams() opts the page out of static prerendering; wrap
  // in Suspense so Next can still produce the loading shell at build.
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
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.remember ?? true,
      });
      if (result.error) {
        setServerError(result.error.message ?? "Invalid email or password.");
        setSubmitting(false);
        return;
      }
      router.push(next);
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-ember underline-offset-4 hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <Checkbox
                    checked={field.value ?? true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Remember me
                </label>
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
            {submitting ? "Signing in…" : "Log in →"}
          </button>
        </form>
      </Form>
    </AuthShell>
  );
}
