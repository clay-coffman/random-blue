# CLAUDE.md

This file contains Claude Code specific notes for this repository. Shared
project policy, architecture, commands, environment rules, worktree guidance,
and coding conventions live in `AGENTS.md`; read that first.

## Project at a glance

**Startup State Atlas** — 24-hour hackathon build. Next.js 15 (App Router)
on Cloudflare Workers (via `@opennextjs/cloudflare`), D1 + Drizzle, MapLibre
map, Anthropic Claude `claude-opus-4-7` for source-bound explanations.
Polished founder/investor product on top, agent-native API/CLI/MCP
underneath. Full spec: `docs/hackathon-plan.md`. Distilled requirements:
`docs/requirements.md`. Architecture: `docs/architecture.md`.

**Every UI must be responsive — desktop AND mobile.** Design
mobile-first (Tailwind base = ≤375px), then layer up `sm: md: lg:`.
Test every page you ship at 375 / 768 / 1280px before calling it
done. No horizontal scroll at 375px; tap targets ≥ 44×44 px. Tables
collapse to cards on mobile; the map uses a bottom-sheet sidebar at
narrow widths. Use `mcp__playwright__browser_resize` (or the
`agent-browser` device toolbar) during UI testing. Full policy in
`AGENTS.md` § Coding Style.

## Working in a worktree

If you're a parallel Claude Code session spawned in a worktree, **read
these in order**:

1. `docs/agent-tasks/00-shared-context.md` — port table, schema policy,
   branch protocol, sequencing.
2. Your assigned agent brief: `docs/agent-tasks/agent-<N>-<slice>.md`.
3. `AGENTS.md` (root) — repo policy.
4. `docs/architecture.md` — stack and bindings.

Then `git checkout -b feat/<slice>` (the `protect-main` hook blocks
edits on `main`). Work to your brief's DONE-when criteria. Keep a
clean PR scope.

## Claude Code Hooks

Claude Code uses `.claude/settings.json` for local safety and convenience
hooks. All hook scripts live in `.claude/hooks/` as real files (no
external dependency):

- **`protect-main`** (inline in settings.json) — Edit/Write is blocked
  while the current branch is `main`. Create a feature branch first.
- **`guard-shared-edits.sh`** — kept for parity with the original
  agent-kit setup, but no longer load-bearing now that nothing in
  this repo is a symlink into a shared package. Safe to leave or
  remove.
- **`allow-agent-browser.sh`** — auto-approves `agent-browser` Bash
  invocations.
- **`allow-linear.sh`** — auto-approves Linear API calls (except
  destructive org/team/project/user/workspace mutations).
- **`allow-doppler.sh`** — installed but unused on this project (we
  don't run Doppler). Harmless no-op.
- **`cc-notify.sh`** — Notification + Stop hook (desktop ping).

These hooks are Claude-specific. Codex follows `AGENTS.md`,
`.agents/skills/`, and its own approval policy.

## Claude Skills

Skills live in `.agents/skills/<name>/` as real files. The
corresponding `.claude/skills/<name>` is a relative symlink to
`.agents/skills/<name>` so both Claude and Codex pick them up from a
single source of truth.

To **add a skill**, drop a `SKILL.md` (with frontmatter) into a new
`.agents/skills/<name>/` directory and create the matching
`.claude/skills/<name>` symlink:

```bash
mkdir -p .agents/skills/<name>
$EDITOR .agents/skills/<name>/SKILL.md
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

To **edit a skill**, just edit `.agents/skills/<name>/SKILL.md`
directly. There is no longer any "shared package" to publish back to
— the contents originally came from
[`clay-coffman/agent-kit`](https://github.com/clay-coffman/agent-kit)
but were vendored into this repo for the hackathon to avoid sync
churn. Diverge freely.

Claude-only behavior should stay in `.claude/` and must not duplicate
project policy from `AGENTS.md`.
