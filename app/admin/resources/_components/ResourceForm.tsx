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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipInput } from "./ChipInput";

const Schema = z.object({
  id: z.string().min(2, "id is required (use r_<upstream-id>)"),
  title: z.string().min(2, "title is required"),
  description: z.string().optional(),
  source_url: z.string().url().or(z.literal("")).optional(),
  kind: z.string().optional(),
  contact_email: z.string().email().or(z.literal("")).optional(),
  industries: z.array(z.string()),
  communities: z.array(z.string()),
  topics: z.array(z.string()),
  counties: z.array(z.string()),
  statewide: z.boolean(),
});
type Values = z.infer<typeof Schema>;

interface Props {
  mode: "create" | "edit";
  initial?: Partial<Values> & { id?: string };
  canonicalCounties: string[];
  suggestions: {
    industries: string[];
    communities: string[];
    topics: string[];
  };
}

export function ResourceForm({
  mode,
  initial,
  canonicalCounties,
  suggestions,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id: initial?.id ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      source_url: initial?.source_url ?? "",
      kind: initial?.kind ?? "",
      contact_email: initial?.contact_email ?? "",
      industries: initial?.industries ?? [],
      communities: initial?.communities ?? [],
      topics: initial?.topics ?? [],
      counties: initial?.counties ?? [],
      statewide: initial?.statewide ?? false,
    },
  });

  async function onSubmit(values: Values) {
    setError(null);
    setSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/v1/resources"
          : `/api/v1/resources/${encodeURIComponent(values.id)}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
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
      router.push("/admin/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!initial?.id) return;
    if (!confirm(`Delete resource ${initial.id}? This cannot be undone.`))
      return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/resources/${encodeURIComponent(initial.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        setDeleting(false);
        return;
      }
      router.push("/admin/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setDeleting(false);
    }
  }

  const statewide = form.watch("statewide");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={mode === "edit"}
                  placeholder="r_2547"
                />
              </FormControl>
              <p className="text-xs text-ink-3">
                Preserve upstream IDs as <code>r_&lt;id&gt;</code>.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="source_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kind</FormLabel>
                <FormControl>
                  <Input
                    placeholder="capital | mentors | grant | training | community"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <section className="space-y-4 rounded-tile border-[1.5px] border-topo bg-paper-2 p-4">
          <header>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              Recommendation targeting
            </p>
            <p className="mt-1 text-sm text-ink-2">
              These tags drive matching in the founder recommendation
              engine. Free-form fields lowercase on save; counties pull
              from the canonical Utah county list.
            </p>
          </header>

          <FormField
            control={form.control}
            name="industries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industries</FormLabel>
                <FormControl>
                  <ChipInput
                    mode="free-form"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={suggestions.industries}
                    placeholder="industry-agnostic (matches all)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Communities</FormLabel>
                <FormControl>
                  <ChipInput
                    mode="free-form"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={suggestions.communities}
                    placeholder="all founders"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topics"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topics</FormLabel>
                <FormControl>
                  <ChipInput
                    mode="free-form"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={suggestions.topics}
                    placeholder="no topic tags"
                  />
                </FormControl>
                <p className="text-xs text-ink-3">
                  First topic also feeds the resource <code>kind</code>{" "}
                  index used by CLI/MCP filters.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="statewide"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      Statewide (applies in all counties)
                    </FormLabel>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="counties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counties</FormLabel>
                  <FormControl>
                    <ChipInput
                      mode="fixed"
                      value={field.value}
                      onChange={field.onChange}
                      options={canonicalCounties}
                      caseInsensitive={true}
                      disabled={statewide}
                      placeholder={
                        statewide
                          ? "(disabled — statewide)"
                          : "no counties (matches no founders by location)"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {error ? (
          <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : mode === "create"
                ? "Create →"
                : "Save"}
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-tile border-[1.5px] border-danger bg-paper px-5 py-3 text-sm font-medium text-danger disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
