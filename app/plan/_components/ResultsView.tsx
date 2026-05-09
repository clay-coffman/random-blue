import Link from "next/link";
import { Chip, ScribbleDivider, Tile } from "@/components/brand";
import {
  COMMUNITY_TAGS,
  GOALS,
  INDUSTRIES,
  STAGES,
  labelFor,
} from "@/lib/intake-options";
import { personaIdFromPassport } from "@/lib/intake-fixtures";
import { personaById } from "@/lib/personas";
import type {
  FounderPassportInput,
  RecommendResult,
  RecommendedResource,
} from "@/types/passport";
import { ShareLink } from "./ShareLink";

type Props = {
  passportId: string;
  input: FounderPassportInput;
  result: RecommendResult;
};

export function ResultsView({ passportId, input, result }: Props) {
  const personaId = personaIdFromPassport(passportId);
  const persona = personaId ? personaById(personaId) : undefined;

  const now = result.recommendations.filter((r) => r.bucket === "now").slice(0, 3);
  const next = result.recommendations
    .filter((r) => r.bucket === "next")
    .slice(0, 4);
  const ignore = result.recommendations.filter((r) => r.bucket === "ignore");

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
                  {labelFor(COMMUNITY_TAGS, c) ?? c}
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
          input={input}
          highlightFirst
        />
        <BucketColumn
          tone="ink"
          kicker="↓ DO THIS NEXT"
          title="Weeks 2–6"
          subtitle={`${next.length} action${next.length === 1 ? "" : "s"}`}
          items={next}
          input={input}
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
  input,
  highlightFirst,
}: {
  tone: "ember" | "ink";
  kicker: string;
  title: string;
  subtitle: string;
  items: RecommendedResource[];
  input: FounderPassportInput;
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
          <li key={r.resourceId}>
            <RecommendationCard
              resource={r}
              input={input}
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
              key={r.resourceId}
              className="flex items-start gap-2 border-b border-dashed border-topo pb-2 last:border-0"
            >
              <span aria-hidden className="mt-1 font-mono text-xs text-ink-3">
                ✕
              </span>
              <div>
                <p className="text-sm line-through decoration-ink-3">
                  {r.title}
                </p>
                <p className="text-xs text-ink-3">{r.because}</p>
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
  input,
  highlight,
}: {
  resource: RecommendedResource;
  input: FounderPassportInput;
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
        <ResourceCta resource={resource} input={input} />
      </div>
    </Tile>
  );
}

function ResourceCta({
  resource,
  input,
}: {
  resource: RecommendedResource;
  input: FounderPassportInput;
}) {
  // Prefer mailto when the resource has a contact address — the action
  // text on capital cards reads "Email info@…", and a website href is a
  // visible lie (B8 in docs/e2e-findings-2026-05-09.md). Falls through to
  // sourceUrl for non-email CTAs ("Apply", "Book a call", etc.).
  const href = resource.contactEmail
    ? buildMailto(resource.contactEmail, resource, input)
    : resource.sourceUrl;
  if (href) {
    const isMailto = href.startsWith("mailto:");
    return (
      <a
        href={href}
        {...(isMailto
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
        className="font-mono text-[11px] font-bold uppercase tracking-wider text-ember hover:underline"
      >
        {resource.actionText} →
      </a>
    );
  }
  return (
    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ember">
      {resource.actionText}
    </span>
  );
}

// Build a mailto: with a draft subject + body pre-filled from the founder
// passport. The founder will edit before sending — keep the body neutral
// and short. Missing passport fields degrade gracefully (subject/body
// just omit them rather than rendering "undefined").
function buildMailto(
  email: string,
  resource: RecommendedResource,
  input: FounderPassportInput,
): string {
  const stage = input.stage ? labelFor(STAGES, input.stage) : undefined;
  const industry = input.industry
    ? labelFor(INDUSTRIES, input.industry)
    : undefined;
  const goal = input.goal ? labelFor(GOALS, input.goal) : undefined;
  const location = input.city ?? (input.county ? `${input.county} County` : undefined);

  const subjectParts = ["Intro from a Utah founder"];
  if (stage && industry) subjectParts.push(`(${stage}, ${industry})`);
  else if (stage) subjectParts.push(`(${stage})`);
  else if (industry) subjectParts.push(`(${industry})`);
  const subject = subjectParts.join(" ");

  const lines: string[] = ["Hi,", ""];
  const introBits: string[] = [];
  if (location) introBits.push(`I'm a founder based in ${location}`);
  else introBits.push("I'm a Utah-based founder");
  if (industry) introBits.push(`working in ${industry.toLowerCase()}`);
  if (stage) introBits.push(`at the ${stage.toLowerCase()} stage`);
  lines.push(introBits.join(", ") + ".");
  if (goal) lines.push(`Right now I'm focused on ${goal.toLowerCase()}.`);
  lines.push("");
  lines.push(
    `I came across ${resource.title} via Utah's Startup State Atlas and wanted to reach out about a possible fit.`,
  );
  lines.push("");
  lines.push("Happy to share more context if useful.");
  lines.push("");
  lines.push("Thanks,");

  const body = lines.join("\r\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
