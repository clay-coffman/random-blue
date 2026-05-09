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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { KNOWN_SECTORS, sectorDisplayName } from "@/lib/sectors";
import { STAGE_VALUES, isKnownStage, stageDisplayName } from "@/lib/stages";

const optionalUrl = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^https?:\/\//.test(v),
    "Must start with http:// or https://",
  );

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  website: optionalUrl,
  description: z.string().max(1000).optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
  employee_count: z.string().optional(),
  hiring_status: z.boolean().optional(),
  // Stored as string in the form; converted to number in onSubmit.
  // Avoids zod transform/preprocess which forks input vs output types
  // and confuses react-hook-form's TFieldValues / TTransformedValues.
  founding_year: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1800 && Number(v) <= 2100),
      "Year between 1800 and 2100",
    ),
  logo_url: optionalUrl,
  // Stored as TEXT but parsed as JSON downstream — reject non-JSON
  // strings on write so /api/v1/companies/:slug consumers don't throw.
  founder_team_json: z
    .string()
    .optional()
    .refine(
      (s) => {
        if (!s) return true;
        try {
          JSON.parse(s);
          return true;
        } catch {
          return false;
        }
      },
      "Must be valid JSON (e.g. [{\"name\":\"...\",\"role\":\"...\"}])",
    ),
  // Admin-only:
  slug: z.string().optional(),
  linkedin: z.string().optional(),
  address_text: z.string().optional(),
});

export type CompanyEditValues = z.infer<typeof Schema>;

interface Props {
  slug: string;
  company: Partial<Omit<CompanyEditValues, "founding_year">> & {
    name: string;
    founding_year?: number | null;
  };
  canEditLockedFields: boolean;
}

export function EditorForm({ slug, company, canEditLockedFields }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CompanyEditValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      name: company.name ?? "",
      website: company.website ?? "",
      description: company.description ?? "",
      sector: company.sector ?? "",
      stage: company.stage ?? "",
      employee_count: company.employee_count ?? "",
      hiring_status: company.hiring_status ?? false,
      founding_year:
        company.founding_year !== undefined && company.founding_year !== null
          ? String(company.founding_year)
          : "",
      logo_url: company.logo_url ?? "",
      founder_team_json: company.founder_team_json ?? "",
      slug: company.slug ?? "",
      linkedin: company.linkedin ?? "",
      address_text: company.address_text ?? "",
    },
  });

  async function onSubmit(values: CompanyEditValues) {
    setServerError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      // Strip empty strings; convert founding_year to number on the wire.
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === "" || v === undefined) continue;
        if (k === "founding_year") {
          payload[k] = Number(v);
          continue;
        }
        payload[k] = v;
      }
      // Owner mode: don't send admin-only fields even if present in form.
      if (!canEditLockedFields) {
        delete payload.slug;
        delete payload.linkedin;
        delete payload.address_text;
      }
      const res = await fetch(`/api/v1/companies/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setServerError(
          json?.error?.message ?? `Save failed (HTTP ${res.status}).`,
        );
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Section label="Identity">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name{!canEditLockedFields ? " · locked" : ""}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={!canEditLockedFields}
                    aria-disabled={!canEditLockedFields}
                  />
                </FormControl>
                {!canEditLockedFields ? (
                  <p className="text-xs text-ink-3">
                    Contact GOEO to change the legal name.
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (≤ 1000 chars)</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input type="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>
        <Section label="Operating">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => {
                const current = field.value ?? "";
                const showLegacy =
                  current !== "" && !KNOWN_SECTORS.includes(current);
                return (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-tile border-[1.5px] border-ink bg-paper-2 p-2 text-sm"
                        {...field}
                      >
                        <option value="">—</option>
                        {showLegacy ? (
                          <option value={current}>Current: {current}</option>
                        ) : null}
                        {/* Some entries share a paint key (Bio/Life Sciences/Health → bio,
                            Consumer/Marketplaces → consumer); we intentionally keep them
                            distinct here because each value round-trips back to D1. */}
                        {KNOWN_SECTORS.map((s) => (
                          <option key={s} value={s}>
                            {sectorDisplayName(s)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => {
                const current = field.value ?? "";
                const showLegacy = current !== "" && !isKnownStage(current);
                return (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-tile border-[1.5px] border-ink bg-paper-2 p-2 text-sm"
                        {...field}
                      >
                        <option value="">—</option>
                        {showLegacy ? (
                          <option value={current}>Current: {current}</option>
                        ) : null}
                        {STAGE_VALUES.map((s) => (
                          <option key={s} value={s}>
                            {stageDisplayName(s)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="employee_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employees</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="founding_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Founding year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1800}
                      max={2100}
                      placeholder="2018"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="hiring_status"
            render={({ field }) => (
              <FormItem>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  We&rsquo;re hiring
                </label>
              </FormItem>
            )}
          />
        </Section>

        {canEditLockedFields ? (
          <Section label="Admin only · locked for owners">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>
        ) : null}

        {serverError ? (
          <p className="rounded-tile border border-danger bg-paper-2 px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-tile border border-sage bg-sage-tint px-3 py-2 text-sm text-sage">
            Saved. Live across the website, .md, .json, and API.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Publish changes →"}
          </button>
          <a
            href={`/startups/${slug}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-5 py-3"
          >
            View live profile ↗
          </a>
        </div>
      </form>
    </Form>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        ↓ {label}
      </legend>
      {children}
    </fieldset>
  );
}
