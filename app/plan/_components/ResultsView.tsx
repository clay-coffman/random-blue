import Link from "next/link";
import { Chip, ScribbleDivider, Tile } from "@/components/brand";
import { labelFor, GOALS, STAGES, INDUSTRIES } from "@/lib/intake-options";
import { personaIdFromPassport } from "@/lib/intake-fixtures";
import { personaById } from "@/lib/personas";
import type {
  FounderPassportInput,
  RecommendResponse,
  RecommendedResource,
} from "@/types/api";
import { ShareLink } from "./ShareLink";

type Props = {
  passportId: string;
  input: FounderPassportInput;
  response: RecommendResponse;
};

const ucfirst = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export function ResultsView({ passportId, input, response }: Props) {
  const personaId = personaIdFromPassport(passportId);
  const persona = personaId ? personaById(personaId) : undefined;

  const now = response.recommendations.filter((r) => r.bucket === "now").slice(0, 3);
  const next = response.recommendations
    .filter((r) => r.bucket === "next")
    .slice(0, 4);
  const ignore = response.recommendations.filter((r) => r.bucket === "ignore");

  const headline = buildHeadline(persona?.displayName.split(",")[0], input);

  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-8 sm:px-7">
      {/* Header strip */}
      <header className="flex flex-col gap-4 border-b-[1.5px] border-ink pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
              90-day plan · for {passportId}
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
              {headline}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {input.goal && (
                <Chip tone="ember-tint">{labelFor(GOALS, input.goal)}</Chip>
              )}
              {input.stage && (
                <Chip tone="sky-tint">{labelFor(STAGES, input.stage)}</Chip>
              )}
              {input.industry && (
                <Chip tone="sage-tint">
                  {labelFor(INDUSTRIES, input.industry)}
                </Chip>
              )}
              {input.county && <Chip>{input.county} County</Chip>}
              {input.communities.map((c) => (
                <Chip key={c} tone="stone">
                  {ucfirst(c)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <ShareLink passportId={passportId} />
            <Link
              href="/founder"
              className="self-end font-mono text-[11px] uppercase tracking-wider text-ink-3 underline-offset-2 hover:text-ember hover:underline"
            >
              edit passport →
            </Link>
          </div>
        </div>
      </header>

      {/* Buckets */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <BucketColumn
          tone="ember"
          kicker="↓ DO THIS NOW"
          title="This week"
          subtitle={`${now.length} action${now.length === 1 ? "" : "s"}`}
          items={now}
          highlightFirst
        />
        <BucketColumn
          tone="ink"
          kicker="↓ DO THIS NEXT"
          title="Weeks 2–6"
          subtitle={`${next.length} action${next.length === 1 ? "" : "s"}`}
          items={next}
        />
        <IgnoreColumn items={ignore} />
      </section>

      <ScribbleDivider className="my-12" />

      <footer className="rounded-tile border-[1.5px] border-ink bg-ink px-5 py-4 text-paper">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-topo">
            plan_id · {passportId} · saved
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-topo">
            same plan as JSON →{" "}
            <span className="text-ember-tint">
              /api/v1/founder-passports/{passportId}/plan
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function buildHeadline(
  firstName: string | undefined,
  input: FounderPassportInput,
): string {
  const parts: string[] = [];
  if (firstName) parts.push(firstName);
  if (input.city) parts.push(input.city);
  else if (input.county) parts.push(`${input.county} County`);
  if (input.stage) parts.push(labelFor(STAGES, input.stage) ?? input.stage);
  if (input.goal) parts.push(labelFor(GOALS, input.goal) ?? input.goal);
  if (parts.length === 0) return "Your 90-day plan.";
  return parts.join(" · ");
}

function BucketColumn({
  tone,
  kicker,
  title,
  subtitle,
  items,
  highlightFirst,
}: {
  tone: "ember" | "ink";
  kicker: string;
  title: string;
  subtitle: string;
  items: RecommendedResource[];
  highlightFirst?: boolean;
}) {
  if (items.length === 0) {
    return (
      <Tile variant="subtle">
        <p
          className={`font-mono text-[11px] uppercase tracking-wider ${
            tone === "ember" ? "text-ember" : "text-ink-3"
          }`}
        >
          {kicker}
        </p>
        <h2 className="mt-1 font-serif text-2xl">{title}</h2>
        <p className="mt-3 text-sm text-ink-3">
          Nothing landed in this bucket — try widening your needs or stage on
          the form.
        </p>
      </Tile>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p
          className={`font-mono text-[11px] uppercase tracking-wider ${
            tone === "ember" ? "text-ember" : "text-ink-3"
          }`}
        >
          {kicker}
        </p>
        <h2 className="font-serif text-2xl leading-tight">{title}</h2>
        <p className="font-hand text-sm text-ink-3">{subtitle}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((r, i) => (
          <li key={r.resource_id}>
            <RecommendationCard
              resource={r}
              highlight={highlightFirst && i === 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function IgnoreColumn({ items }: { items: RecommendedResource[] }) {
  if (items.length === 0) return null;
  return (
    <Tile variant="subtle">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
              ↓ IGNORE FOR NOW
            </p>
            <h2 className="font-serif text-2xl leading-tight">
              {items.length} thing{items.length === 1 ? "" : "s"} you don&apos;t
              need
            </h2>
            <p className="mt-1 font-hand text-sm text-ink-3">
              Atlas is opinionated about what to skip. Click to see why each
              didn&apos;t fit.
            </p>
          </div>
          <span
            aria-hidden
            className="font-mono text-[11px] text-ink-3 group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <ul className="mt-4 flex flex-col gap-2">
          {items.map((r) => (
            <li
              key={r.resource_id}
              className="flex items-start gap-2 border-b border-dashed border-topo pb-2 last:border-0"
            >
              <span aria-hidden className="mt-1 font-mono text-xs text-ink-3">
                ✕
              </span>
              <div>
                <p className="text-sm line-through decoration-ink-3">
                  {r.title}
                </p>
                <p className="text-xs text-ink-3">
                  {r.reasons[0] ?? "Low fit on your passport."}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </Tile>
  );
}

function RecommendationCard({
  resource,
  highlight,
}: {
  resource: RecommendedResource;
  highlight?: boolean;
}) {
  return (
    <Tile
      shadow="sketch-hover"
      className={
        highlight
          ? "border-ember shadow-[3px_3px_0_var(--color-ember)]"
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {resource.kind ?? "Resource"}
          </p>
          <h3 className="mt-1 font-serif text-lg leading-tight">
            {resource.title}
          </h3>
        </div>
        <ScoreBadge score={resource.score} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">
        {resource.because}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-topo pt-3">
        <details className="text-xs text-ink-3">
          <summary className="cursor-pointer font-mono uppercase tracking-wider">
            why →
          </summary>
          <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-ink-2">
            {resource.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </details>
        <ResourceCta resource={resource} />
      </div>
    </Tile>
  );
}

function ResourceCta({ resource }: { resource: RecommendedResource }) {
  if (resource.source_url) {
    return (
      <a
        href={resource.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[11px] font-bold uppercase tracking-wider text-ember hover:underline"
      >
        {resource.action_text} →
      </a>
    );
  }
  return (
    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ember">
      {resource.action_text}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "border-sage text-sage"
      : score >= 40
        ? "border-sky text-sky"
        : "border-ink-3 text-ink-3";
  return (
    <span
      className={`grid h-11 w-11 flex-none place-items-center rounded-full border-[2px] font-serif text-base ${tone}`}
      aria-label={`Match score ${score}`}
    >
      {score}
    </span>
  );
}
