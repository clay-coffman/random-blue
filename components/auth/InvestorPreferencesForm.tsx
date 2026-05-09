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

export const INVESTOR_TYPES = [
  { id: "vc", label: "VC" },
  { id: "angel", label: "Angel" },
  { id: "family_office", label: "Family office" },
  { id: "corp_dev", label: "Corp dev" },
  { id: "scout", label: "Scout" },
  { id: "lp", label: "LP" },
] as const;

export const STAGES = [
  { id: "pre_seed", label: "Pre-seed" },
  { id: "seed", label: "Seed" },
  { id: "series_a", label: "Series A" },
  { id: "growth", label: "Growth" },
] as const;

export const SECTORS = [
  { id: "b2b_saas", label: "B2B SaaS" },
  { id: "fintech", label: "FinTech" },
  { id: "ai", label: "AI" },
  { id: "aerospace", label: "Aerospace" },
  { id: "life_sciences", label: "Life sciences" },
  { id: "energy", label: "Energy" },
  { id: "consumer", label: "Consumer" },
] as const;

export const GEO_FOCUS = [
  { id: "wasatch_front", label: "Wasatch Front" },
  { id: "statewide", label: "Statewide" },
  { id: "national", label: "National" },
] as const;

const Schema = z.object({
  firm_name: z.string().min(2, "Enter your firm or affiliation"),
  investor_type: z.enum([
    "vc",
    "angel",
    "family_office",
    "corp_dev",
    "scout",
    "lp",
  ]),
  stages: z.array(z.string()).min(1, "Pick at least one stage"),
  sectors: z.array(z.string()).min(1, "Pick at least one sector"),
  check_size_min: z.coerce.number().int().min(0),
  check_size_max: z.coerce.number().int().min(0),
  geo_focus: z.array(z.string()).min(1, "Pick at least one geo"),
});

export type InvestorPreferencesValues = z.infer<typeof Schema>;

export type InvestorPreferencesDefaults = Partial<InvestorPreferencesValues>;

interface Props {
  defaults?: InvestorPreferencesDefaults;
  onSaved: () => void;
  submitLabel?: string;
}

export function InvestorPreferencesForm({
  defaults,
  onSaved,
  submitLabel = "Save preferences →",
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<InvestorPreferencesValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      firm_name: defaults?.firm_name ?? "",
      investor_type: defaults?.investor_type ?? "vc",
      stages: defaults?.stages ?? ["seed"],
      sectors: defaults?.sectors ?? ["b2b_saas"],
      check_size_min: defaults?.check_size_min ?? 100_000,
      check_size_max: defaults?.check_size_max ?? 1_000_000,
      geo_focus: defaults?.geo_focus ?? ["wasatch_front"],
    },
  });

  async function onSubmit(values: InvestorPreferencesValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/investor-profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
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
      onSaved();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Network error. Please retry.",
      );
      setSubmitting(false);
    }
  }

  const stages = form.watch("stages");
  const sectors = form.watch("sectors");
  const geoFocus = form.watch("geo_focus");
  const investorType = form.watch("investor_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="firm_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firm / affiliation</FormLabel>
              <FormControl>
                <Input placeholder="Pelion Ventures" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="investor_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <ChipGroup
                options={INVESTOR_TYPES}
                value={[investorType]}
                onChange={(v) => field.onChange(v[0])}
                multi={false}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stages of interest</FormLabel>
              <ChipGroup
                options={STAGES}
                value={stages}
                onChange={field.onChange}
                multi
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sectors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sectors of interest</FormLabel>
              <ChipGroup
                options={SECTORS}
                value={sectors}
                onChange={field.onChange}
                multi
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="check_size_min"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check size · min ($)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={5000} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="check_size_max"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check size · max ($)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={5000} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="geo_focus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geographic focus</FormLabel>
              <ChipGroup
                options={GEO_FOCUS}
                value={geoFocus}
                onChange={field.onChange}
                multi
              />
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
          {submitting ? "Saving…" : submitLabel}
        </button>
      </form>
    </Form>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
  multi,
}: {
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string[];
  onChange: (v: string[]) => void;
  multi: boolean;
}) {
  function toggle(id: string) {
    if (multi) {
      onChange(
        value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
      );
    } else {
      onChange([id]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o) => {
        const selected = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={selected}
            className={`rounded-pill border-[1.5px] px-3 py-1.5 text-sm font-medium transition ${
              selected
                ? "border-ember bg-ember text-paper"
                : "border-topo bg-paper-2 text-ink hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
