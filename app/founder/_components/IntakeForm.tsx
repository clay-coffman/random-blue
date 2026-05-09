"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chip } from "@/components/brand";
import { cn } from "@/lib/utils";
import {
  parseEnrichResponse,
  toWirePassportInput,
  fromWireRecommendResponse,
  type PassportFieldName,
} from "@/lib/api-codec";
import {
  BUSINESS_SIZES,
  COMMUNITY_TAGS,
  COUNTIES,
  FORM_NEEDS,
  GOALS,
  INDUSTRIES,
  STAGES,
  URGENCIES,
  type Option,
} from "@/lib/intake-options";
import { isPersonaId, passportIdFor } from "@/lib/intake-fixtures";
import { recommendMock } from "@/lib/recommend-mock";
import type { RecommendResponseWire } from "@/types/api";
import type { FounderPassportInput } from "@/types/passport";
import { LiveJsonPreview } from "./LiveJsonPreview";

type IntakeFormProps = {
  initial?: FounderPassportInput;
  personaId?: string;
};

type EnrichState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; filled: PassportFieldName[] }
  | { status: "degraded" };

const emptyPassport = (): FounderPassportInput => ({
  websiteUrl: "",
  county: undefined,
  city: "",
  stage: undefined,
  industry: undefined,
  communities: [],
  goal: undefined,
  urgency: undefined,
  businessSize: undefined,
  needs: [],
  constraints: [],
});

const localPassportId = (): string =>
  `fp_local_${Math.random().toString(36).slice(2, 10)}`;

const SESSION_KEY = (id: string) => `atlas:plan:${id}`;

export function IntakeForm({ initial, personaId }: IntakeFormProps) {
  const router = useRouter();
  const [passport, setPassport] = useState<FounderPassportInput>(() => ({
    ...emptyPassport(),
    ...(initial ?? {}),
  }));
  const [enrich, setEnrich] = useState<EnrichState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [prefilledKeys, setPrefilledKeys] = useState<Set<PassportFieldName>>(
    new Set(),
  );

  // Reset when persona changes via the URL.
  const initialKey = JSON.stringify({ initial, personaId });
  const lastKey = useRef(initialKey);
  useEffect(() => {
    if (lastKey.current !== initialKey) {
      lastKey.current = initialKey;
      setPassport({ ...emptyPassport(), ...(initial ?? {}) });
      setEnrich({ status: "idle" });
      setPrefilledKeys(new Set());
      setSubmitting(false);
    }
  }, [initial, initialKey]);

  const update = <K extends keyof FounderPassportInput>(
    key: K,
    value: FounderPassportInput[K],
  ) => {
    setPassport((p) => ({ ...p, [key]: value }));
  };

  const toggleArrayValue = (
    key: "communities" | "needs",
    value: string,
  ) => {
    setPassport((p) => {
      const next = new Set(p[key] ?? []);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...p, [key]: Array.from(next) };
    });
    setPrefilledKeys((s) => {
      if (!s.has(key)) return s;
      const next = new Set(s);
      next.delete(key);
      return next;
    });
  };

  const clearPrefillChip = (field: PassportFieldName) => {
    setPrefilledKeys((s) => {
      const next = new Set(s);
      next.delete(field);
      return next;
    });
  };

  async function runEnrich() {
    const url = passport.websiteUrl?.trim();
    if (!url) return;
    setEnrich({ status: "loading" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch("/api/v1/founder-passports/enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ website_url: url }),
        signal: controller.signal,
      });
      if (!res.ok) {
        setEnrich({ status: "degraded" });
        return;
      }
      const raw = await res.json();
      const parsed = parseEnrichResponse(raw);
      if (!parsed || parsed.degraded || parsed.fields.length === 0) {
        setEnrich({ status: "degraded" });
        return;
      }
      const filled: PassportFieldName[] = [];
      setPassport((p) => {
        const next = { ...p };
        for (const f of parsed.fields) {
          const k = f.name as PassportFieldName;
          // The codec already validated value type per field.
          if (k === "communities" || k === "needs" || k === "constraints") {
            next[k] = f.value as string[];
          } else if (k === "websiteUrl") {
            next.websiteUrl = f.value as string;
          } else {
            next[k] = f.value as string;
          }
          filled.push(k);
        }
        return next;
      });
      setPrefilledKeys(new Set(filled));
      setEnrich({ status: "success", filled });
    } catch {
      setEnrich({ status: "degraded" });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    let result: ReturnType<typeof recommendMock> | undefined;
    let resolvedPassportId: string | undefined;

    try {
      const res = await fetch("/api/v1/resources/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toWirePassportInput(passport)),
      });
      if (res.ok) {
        const wire = (await res.json()) as RecommendResponseWire;
        result = fromWireRecommendResponse(wire);
        resolvedPassportId = result.passportId;
      }
    } catch {
      // network or DNS failure — fall through to mock
    }

    if (!result || !resolvedPassportId) {
      // Agent 2 endpoint missing — synthesise locally.
      resolvedPassportId =
        personaId && isPersonaId(personaId)
          ? passportIdFor(personaId)
          : localPassportId();
      result = recommendMock(passport, resolvedPassportId);
    }

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          SESSION_KEY(resolvedPassportId),
          JSON.stringify({ input: passport, result }),
        );
      } catch {
        // sessionStorage may be unavailable (private mode) — non-fatal
      }
    }

    try {
      router.push(`/plan/${resolvedPassportId}`);
    } finally {
      // Reset so a back-navigation re-enables the submit button.
      setSubmitting(false);
    }
  }

  const isPrefilled = (key: PassportFieldName) => prefilledKeys.has(key);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="flex flex-col gap-6">
        {/* Section: website URL */}
        <FieldGroup
          step="00"
          title="Got a website?"
          sub="Paste it and we'll pre-fill what we can. Skippable — manual fill always works."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              inputMode="url"
              placeholder="https://your-business.com"
              value={passport.websiteUrl ?? ""}
              onChange={(e) => update("websiteUrl", e.target.value)}
              className="h-11 w-full rounded-tile border-[1.5px] border-ink bg-paper px-3 font-mono text-sm placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-ember/40"
              aria-describedby="enrich-status"
            />
            <button
              type="button"
              onClick={runEnrich}
              disabled={
                !passport.websiteUrl?.trim() || enrich.status === "loading"
              }
              className="inline-flex h-11 items-center justify-center rounded-tile border-[1.5px] border-ink bg-paper-2 px-4 font-mono text-[11px] uppercase tracking-wider transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enrich.status === "loading" ? "Reading…" : "Pre-fill →"}
            </button>
          </div>
          <p
            id="enrich-status"
            role="status"
            aria-live="polite"
            className="mt-2 min-h-[1.25rem] font-hand text-sm text-ink-3"
          >
            {enrich.status === "loading" && "Reading your site…"}
            {enrich.status === "success" &&
              `Filled ${enrich.filled.length} field${
                enrich.filled.length === 1 ? "" : "s"
              }. Edit anything that's off.`}
            {enrich.status === "degraded" &&
              "Couldn't read that site — fill in below."}
          </p>
        </FieldGroup>

        {/* Section: where */}
        <FieldGroup step="01" title="Where in Utah?">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="County"
              value={passport.county}
              options={COUNTIES}
              onChange={(v) => {
                update("county", v);
                clearPrefillChip("county");
              }}
              placeholder="Select a county"
              prefilled={isPrefilled("county")}
              required
              onClearChip={() => clearPrefillChip("county")}
            />
            <TextField
              label="City (optional)"
              value={passport.city ?? ""}
              onChange={(v) => {
                update("city", v);
                clearPrefillChip("city");
              }}
              placeholder="e.g. Salt Lake City"
              prefilled={isPrefilled("city")}
              onClearChip={() => clearPrefillChip("city")}
            />
          </div>
        </FieldGroup>

        {/* Section: stage + industry */}
        <FieldGroup step="02" title="What stage and industry?">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Stage"
              value={passport.stage}
              options={STAGES}
              onChange={(v) => {
                update("stage", v);
                clearPrefillChip("stage");
              }}
              placeholder="Pick a stage"
              prefilled={isPrefilled("stage")}
              required
              onClearChip={() => clearPrefillChip("stage")}
            />
            <SelectField
              label="Industry"
              value={passport.industry}
              options={INDUSTRIES}
              onChange={(v) => {
                update("industry", v);
                clearPrefillChip("industry");
              }}
              placeholder="Pick an industry"
              prefilled={isPrefilled("industry")}
              required
              onClearChip={() => clearPrefillChip("industry")}
            />
          </div>
        </FieldGroup>

        {/* Section: identity */}
        <FieldGroup
          step="03"
          title="Founder identity"
          sub="Pick any that apply. We use these to surface the right communities and grants."
        >
          <ChipMultiSelect
            options={COMMUNITY_TAGS}
            selected={passport.communities}
            onToggle={(v) => toggleArrayValue("communities", v)}
            prefilled={isPrefilled("communities")}
            onClearChip={() => clearPrefillChip("communities")}
          />
        </FieldGroup>

        {/* Section: goal + urgency */}
        <FieldGroup step="04" title="What are you trying to do?">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Goal"
              value={passport.goal}
              options={GOALS}
              onChange={(v) => {
                update("goal", v);
                clearPrefillChip("goal");
              }}
              placeholder="Pick your top goal"
              prefilled={isPrefilled("goal")}
              required
              onClearChip={() => clearPrefillChip("goal")}
            />
            <RadioField
              label="Urgency"
              name="urgency"
              value={passport.urgency}
              options={URGENCIES}
              onChange={(v) => update("urgency", v)}
            />
          </div>
        </FieldGroup>

        {/* Section: size + needs */}
        <FieldGroup step="05" title="What do you need now?">
          <div className="grid gap-3">
            <SelectField
              label="Business size / revenue stage"
              value={passport.businessSize}
              options={BUSINESS_SIZES}
              onChange={(v) => update("businessSize", v)}
              placeholder="Pick a size"
            />
            <div>
              <Label>What do you want? (pick any)</Label>
              <ChipMultiSelect
                options={FORM_NEEDS}
                selected={passport.needs}
                onToggle={(v) => toggleArrayValue("needs", v)}
                prefilled={isPrefilled("needs")}
                onClearChip={() => clearPrefillChip("needs")}
              />
            </div>
          </div>
        </FieldGroup>

        <div className="sticky bottom-2 z-10 flex flex-col items-stretch gap-3 rounded-tile border-[1.5px] border-ink bg-paper-2/95 px-4 py-3 shadow-sketch backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="font-hand text-sm text-ink-3">
            We&apos;ll write your 90-day plan and take you to a shareable URL.
          </p>
          <button
            type="submit"
            disabled={submitting || !canSubmit(passport)}
            className="inline-flex h-11 items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 font-mono text-[12px] uppercase tracking-wider text-paper transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Writing your plan…" : "Get my plan →"}
          </button>
        </div>
      </div>

      <aside className="md:sticky md:top-24 md:h-fit">
        <LiveJsonPreview passport={passport} />
        <p className="mt-3 font-hand text-sm text-ink-3">
          ↑ updates as you answer. This is the structured passport our matcher
          and the agent API consume.
        </p>
      </aside>
    </form>
  );
}

function canSubmit(p: FounderPassportInput): boolean {
  return Boolean(p.county && p.stage && p.industry && p.goal);
}

function FieldGroup({
  step,
  title,
  sub,
  children,
}: {
  step: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-tile border-[1.5px] border-topo bg-paper-2 p-4 sm:p-5">
      <legend className="px-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">
          Q{step}
        </span>
      </legend>
      <h3 className="font-serif text-xl leading-tight">{title}</h3>
      {sub && <p className="mt-1 text-sm text-ink-3">{sub}</p>}
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">
      {children}
    </span>
  );
}

function PrefilledChip({ onClear }: { onClear?: () => void }) {
  // `onMouseDown` short-circuits the wrapping label's click-to-focus
  // behavior so dismissing the chip doesn't also focus/open the field.
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClear?.();
      }}
      className="ml-2 inline-flex items-center gap-1 rounded-pill border-[1.5px] border-ember bg-ember-tint px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ember"
      aria-label="dismiss prefilled marker"
    >
      filled from your site ✕
    </button>
  );
}

function FieldShell({
  label,
  required,
  prefilled,
  onClearChip,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  prefilled?: boolean;
  onClearChip?: () => void;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="flex items-center">
        <label htmlFor={htmlFor}>
          <Label>
            <span className="inline-flex items-center">
              {label}
              {required && <span className="ml-1 text-ember">*</span>}
            </span>
          </Label>
        </label>
        {prefilled && <PrefilledChip onClear={onClearChip} />}
      </div>
      {children}
    </div>
  );
}

const slugify = (s: string) =>
  s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

function TextField({
  label,
  value,
  onChange,
  placeholder,
  prefilled,
  onClearChip,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefilled?: boolean;
  onClearChip?: () => void;
}) {
  const id = `tf-${slugify(label)}`;
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      prefilled={prefilled}
      onClearChip={onClearChip}
    >
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-tile border-[1.5px] border-ink bg-paper px-3 text-sm placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-ember/40"
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  prefilled,
  required,
  onClearChip,
}: {
  label: string;
  value: string | undefined;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  prefilled?: boolean;
  required?: boolean;
  onClearChip?: () => void;
}) {
  const id = `sf-${slugify(label)}`;
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      required={required}
      prefilled={prefilled}
      onClearChip={onClearChip}
    >
      <div className="relative">
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="h-11 w-full appearance-none rounded-tile border-[1.5px] border-ink bg-paper px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ember/40"
        >
          <option value="" disabled>
            {placeholder ?? "Select…"}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ink-3"
        >
          ▾
        </span>
      </div>
    </FieldShell>
  );
}

function RadioField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string | undefined;
  options: Option[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill border-[1.5px] px-3 py-1.5 text-sm transition",
                checked
                  ? "border-ember bg-ember-tint text-ember"
                  : "border-ink bg-paper text-ink hover:bg-paper-2",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  onToggle,
  prefilled,
  onClearChip,
}: {
  options: Option[];
  selected: string[];
  onToggle: (v: string) => void;
  prefilled?: boolean;
  onClearChip?: () => void;
}) {
  const set = useMemo(() => new Set(selected), [selected]);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = set.has(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o.value)}
              className={cn(
                "inline-flex min-h-[44px] items-center gap-2 rounded-pill border-[1.5px] px-3 py-1.5 text-sm transition",
                on
                  ? "border-ember bg-ember-tint text-ember"
                  : "border-ink bg-paper hover:bg-paper-2",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-sm border-[1.5px]",
                  on
                    ? "border-ember bg-ember text-paper"
                    : "border-ink bg-paper",
                )}
              >
                {on ? "✓" : null}
              </span>
              {o.label}
            </button>
          );
        })}
      </div>
      {prefilled && (
        <div className="mt-2">
          <Chip tone="ember-tint" size="sm">
            <button
              type="button"
              onClick={onClearChip}
              aria-label="dismiss prefilled marker"
              className="inline-flex items-center gap-1"
            >
              filled from your site ✕
            </button>
          </Chip>
        </div>
      )}
    </div>
  );
}
