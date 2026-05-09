"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  cliCommands,
  cliInstallExample,
  claudeDesktopConfig,
  curlExample,
  endpoints,
  mcpPrompts,
  mcpResources,
  mcpTools,
  remoteMcpClaudeConfig,
  remoteMcpExample,
  remoteMcpStdioBridgeConfig,
} from "./_data";

type TabId = "api" | "cli" | "mcp";

const TABS: { id: TabId; label: string }[] = [
  { id: "api", label: "API" },
  { id: "cli", label: "CLI" },
  { id: "mcp", label: "MCP" },
];

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Browser refused (e.g. HTTP context). Drop silently — the user
      // can still select+copy by hand.
    }
  }
  return (
    <div className="relative my-3">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border-[1.5px] border-ink/20 bg-paper-2 px-3 py-1 font-mono text-xs text-ink shadow-sketch hover:-translate-y-0.5 hover:shadow-sketch-hover focus:outline-none focus:ring-2 focus:ring-ember"
        aria-label="Copy code"
      >
        {copied ? "copied" : "copy"}
      </button>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <pre className="rounded-md border-[1.5px] border-ink/20 bg-ink/95 p-4 pr-16 font-mono text-xs leading-relaxed text-paper sm:text-sm">
          {children}
        </pre>
      </div>
    </div>
  );
}

function TabHeader({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  const refs = useRef<Map<TabId, HTMLButtonElement>>(new Map());

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.id === active);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    const target = TABS[next];
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  }

  return (
    <div role="tablist" onKeyDown={handleKey} className="flex flex-wrap gap-2 border-b-[1.5px] border-topo">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              if (el) refs.current.set(t.id, el);
              else refs.current.delete(t.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`agent-tab-${t.id}`}
            id={`agent-tab-trigger-${t.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`min-h-[44px] px-4 py-2 font-hand text-sm font-bold transition-colors ${
              isActive
                ? "-mb-[1.5px] border-b-[3px] border-ember text-ink"
                : "text-ink-3 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ApiPanel() {
  return (
    <div className="space-y-4">
      <p className="text-base text-ink-2">
        Read endpoints are public. Writes require either a Better Auth session cookie
        (humans through the web) or the <code className="font-mono">X-Atlas-Admin-Token</code>{" "}
        header (machine clients). The full OpenAPI 3.1 spec lives at{" "}
        <a className="text-ember underline" href="/api/v1/openapi.json">
          /api/v1/openapi.json
        </a>
        .
      </p>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-ink-3">
              <th className="border-b-[1.5px] border-topo px-3 py-2 font-mono text-xs uppercase tracking-wide">
                Method
              </th>
              <th className="border-b-[1.5px] border-topo px-3 py-2 font-mono text-xs uppercase tracking-wide">
                Path
              </th>
              <th className="border-b-[1.5px] border-topo px-3 py-2 font-mono text-xs uppercase tracking-wide">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((e) => (
              <tr key={`${e.method}-${e.path}`} className="text-ink">
                <td className="border-b border-topo/60 px-3 py-2 align-top font-mono text-xs">
                  <span
                    className={
                      e.method === "GET"
                        ? "text-sage"
                        : e.method === "POST"
                          ? "text-ember"
                          : "text-ink-2"
                    }
                  >
                    {e.method}
                  </span>
                </td>
                <td className="border-b border-topo/60 px-3 py-2 align-top font-mono text-xs">
                  {e.path}
                </td>
                <td className="border-b border-topo/60 px-3 py-2 align-top">
                  {e.summary}
                  {e.auth && (
                    <span className="ml-2 inline-block rounded bg-ember-tint px-2 py-0.5 font-mono text-[11px] text-ember">
                      {e.auth}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-heading text-lg">Example: recommend</h3>
      <CodeBlock>{curlExample}</CodeBlock>
    </div>
  );
}

function CliPanel() {
  return (
    <div className="space-y-4">
      <p className="text-base text-ink-2">
        For the launch, the CLI ships from the repo. Run <code className="font-mono">npm run cli -- &lt;args&gt;</code> from a checkout — there is no published npm package and no global binary.
      </p>

      <h3 className="font-heading text-lg">Install</h3>
      <CodeBlock>{cliInstallExample}</CodeBlock>

      <h3 className="font-heading text-lg">Subcommands</h3>
      <ul className="space-y-3">
        {cliCommands.map((c) => (
          <li key={c.command}>
            <div className="text-sm text-ink-3">{c.summary}</div>
            <CodeBlock>{c.command}</CodeBlock>
          </li>
        ))}
      </ul>

      <p className="text-sm text-ink-3">
        The CLI reads <code className="font-mono">STARTUP_STATE_API_URL</code> (default{" "}
        <code className="font-mono">http://localhost:3000</code>) and{" "}
        <code className="font-mono">ATLAS_ADMIN_TOKEN</code> from the environment. Write
        subcommands refuse if the token is unset.
      </p>
    </div>
  );
}

function McpPanel() {
  return (
    <div className="space-y-4">
      <p className="text-base text-ink-2">
        Two transports: a stateless remote endpoint at{" "}
        <code className="font-mono">/api/mcp</code> (no install — just paste a
        config snippet into your MCP client), and a local stdio server you run
        from a checkout when you need write tools. The remote endpoint exposes
        7 read tools, 6 resources, and 4 prompts; the local stdio server adds{" "}
        <code className="font-mono">update_company_profile</code> for trusted
        operators running it with <code className="font-mono">ATLAS_ADMIN_TOKEN</code>{" "}
        in env.
      </p>

      <h3 className="font-heading text-lg">
        Remote MCP — paste into Claude Desktop / Claude Code / Cursor
      </h3>
      <p className="text-sm text-ink-3">
        Drop this into your MCP client's config (Claude Desktop:{" "}
        <code className="font-mono">claude_desktop_config.json</code>; Claude
        Code: <code className="font-mono">.mcp.json</code> at your project
        root). Restart the client.
      </p>
      <CodeBlock>{remoteMcpClaudeConfig}</CodeBlock>
      <details className="text-sm text-ink-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wide">
          older clients without native HTTP transport →
        </summary>
        <p className="mt-2">
          Use the <code className="font-mono">mcp-remote</code> stdio bridge
          instead.
        </p>
        <CodeBlock>{remoteMcpStdioBridgeConfig}</CodeBlock>
      </details>

      <h3 className="font-heading text-lg">Local stdio (write tools)</h3>
      <p className="text-sm text-ink-3">
        Required only if you need <code className="font-mono">update_company_profile</code>{" "}
        — the public remote endpoint refuses writes by design. Replace{" "}
        <code className="font-mono">&lt;absolute-path&gt;</code> with your
        checkout path.
      </p>
      <CodeBlock>{claudeDesktopConfig}</CodeBlock>

      <h3 className="font-heading text-lg">Raw HTTP (no MCP client)</h3>
      <CodeBlock>{remoteMcpExample}</CodeBlock>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-heading text-lg">Tools (7 remote + 1 local-only)</h3>
          <ul className="mt-2 space-y-2">
            {mcpTools.map((t) => (
              <li key={t.name} className="text-sm">
                <code className="font-mono text-ink">{t.name}</code>
                {t.localOnly ? (
                  <span className="ml-2 rounded bg-ember-tint px-2 py-0.5 font-mono text-[11px] text-ember">
                    local stdio only
                  </span>
                ) : (
                  t.privileged && (
                    <span className="ml-2 rounded bg-ember-tint px-2 py-0.5 font-mono text-[11px] text-ember">
                      write
                    </span>
                  )
                )}
                <div className="text-ink-3">{t.summary}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-lg">Resources (6)</h3>
          <ul className="mt-2 space-y-1">
            {mcpResources.map((r) => (
              <li key={r} className="font-mono text-xs text-ink">
                {r}
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-heading text-lg">Prompts (4)</h3>
          <ul className="mt-2 space-y-2">
            {mcpPrompts.map((p) => (
              <li key={p.name} className="text-sm">
                <code className="font-mono text-ink">{p.name}</code>
                <div className="text-ink-3">{p.summary}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AgentSurfaceTabs() {
  const [active, setActive] = useState<TabId>("api");
  return (
    <div>
      <TabHeader active={active} onChange={setActive} />
      <div
        id={`agent-tab-${active}`}
        role="tabpanel"
        aria-labelledby={`agent-tab-trigger-${active}`}
        className="pt-6"
      >
        {active === "api" && <ApiPanel />}
        {active === "cli" && <CliPanel />}
        {active === "mcp" && <McpPanel />}
      </div>
    </div>
  );
}
