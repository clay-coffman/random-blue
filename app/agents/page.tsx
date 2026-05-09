import type { Metadata } from "next";
import Link from "next/link";
import { ScribbleDivider, SectionHeader } from "@/components/brand";
import { AgentSurfaceTabs } from "./AgentSurfaceTabs";
import { agentRules, installCards } from "./_data";

export const metadata: Metadata = {
  title: "Agents — Startup State Atlas",
  description:
    "Plug Utah's startup ecosystem into your AI. OpenAPI, CLI, and MCP server for the Startup State Atlas.",
};

export default function AgentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero */}
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ember">
          Agent-native
        </p>
        <h1 className="font-heading text-4xl leading-tight text-ink sm:text-5xl">
          Plug Utah&apos;s startup ecosystem into your AI.
        </h1>
        <p className="max-w-2xl text-base text-ink-2 sm:text-lg">
          Startup State Atlas ships an{" "}
          <Link href="/api/v1/openapi.json" className="text-ember underline">
            OpenAPI 3.1
          </Link>{" "}
          surface, a local CLI (<code className="font-mono">startup-state</code>), and
          two MCP transports — stdio for Claude Desktop, plus a stateless Streamable
          HTTP endpoint at <code className="font-mono">/api/mcp</code>. Same data layer
          underneath, four ways to call it.
        </p>
      </header>

      {/* Install cards */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {installCards.map((card) => {
          const inner = (
            <div
              className={`flex h-full flex-col rounded-tile border-[1.5px] p-4 shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover ${
                card.primary
                  ? "border-ember bg-ember-tint"
                  : "border-ink bg-paper-2"
              }`}
            >
              <div
                className={`font-mono text-xs uppercase tracking-[0.1em] ${
                  card.primary ? "text-ember" : "text-ink-3"
                }`}
              >
                {card.primary ? "★ " : ""}
                {card.kicker}
              </div>
              <div className="mt-2 font-heading text-xl leading-tight text-ink">
                {card.name}
              </div>
              <p className="mt-2 flex-1 text-sm text-ink-2">{card.body}</p>
              <span
                className={`mt-3 inline-flex items-center font-mono text-xs ${
                  card.primary ? "text-ember" : "text-ink"
                }`}
              >
                {card.cta} →
              </span>
            </div>
          );
          return card.href ? (
            <Link
              key={card.name}
              href={card.href}
              className="block focus:outline-none focus:ring-2 focus:ring-ember"
            >
              {inner}
            </Link>
          ) : (
            <div key={card.name}>{inner}</div>
          );
        })}
      </section>

      <ScribbleDivider className="my-12" />

      {/* Tabbed surfaces */}
      <SectionHeader
        kicker="Surfaces"
        kickerTone="ember"
        title="API, CLI, and MCP"
        sub="Pick a surface. Read the contract. Ship."
      />
      <div className="mt-6">
        <AgentSurfaceTabs />
      </div>

      <ScribbleDivider className="my-12" />

      {/* Field-manual reference */}
      <SectionHeader
        kicker="Field manual"
        title="Rules of the road"
        sub="External agents must follow these. Cited in /AGENTS.md and /llms.txt."
      />
      <ol className="mt-6 list-decimal space-y-3 pl-6 text-base text-ink-2">
        {agentRules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/AGENTS.md"
          className="rounded-tile border-[1.5px] border-ink bg-paper-2 p-4 shadow-sketch hover:-translate-y-0.5 hover:shadow-sketch-hover"
        >
          <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-3">
            full rules
          </div>
          <div className="mt-1 font-heading text-lg text-ink">/AGENTS.md →</div>
        </Link>
        <Link
          href="/llms.txt"
          className="rounded-tile border-[1.5px] border-ink bg-paper-2 p-4 shadow-sketch hover:-translate-y-0.5 hover:shadow-sketch-hover"
        >
          <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-3">
            llms.txt
          </div>
          <div className="mt-1 font-heading text-lg text-ink">/llms.txt →</div>
        </Link>
        <Link
          href="/api/v1/openapi.json"
          className="rounded-tile border-[1.5px] border-ember bg-ember-tint p-4 shadow-sketch hover:-translate-y-0.5 hover:shadow-sketch-hover"
        >
          <div className="font-mono text-xs uppercase tracking-[0.1em] text-ember">
            OpenAPI 3.1
          </div>
          <div className="mt-1 font-heading text-lg text-ink">/api/v1/openapi.json →</div>
        </Link>
      </div>
    </main>
  );
}
