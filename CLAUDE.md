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

## Working in a worktree

If you're a parallel Claude Code session spawned in a worktree, **read
these in order**:

1. `docs/agent-tasks/00-shared-context.md` — frozen conventions, port
   table, schema ownership, branch protocol, sequencing.
2. Your assigned agent brief: `docs/agent-tasks/agent-<N>-<slice>.md`.
3. `AGENTS.md` (root) — repo policy.
4. `docs/architecture.md` — stack and bindings.

Then `git checkout -b feat/<slice>` (the `protect-main` hook blocks
edits on `main`). Work to your brief's DONE-when criteria. Keep a
clean PR scope.

> This project uses **`agent-kit`** for shared Claude infrastructure.
> Hooks, agents, and many skills under `.claude/` are symlinks into
> `node_modules/agent-kit/`. See `.agents/skills/agent-kit/SKILL.md`
> for the symlink model and CLI commands.

## Claude Code Hooks

Claude Code uses `.claude/settings.json` for local safety and convenience
hooks (rendered from `agent-kit`'s `claude/settings.template.json` on
`agent-kit init`):

- Edit/Write operations are blocked on protected branches (e.g. `main`,
  `dev`).
- Edit/Write operations against shared `agent-kit` symlinks are blocked,
  with a message pointing the agent at the source repo. Edit shared content
  in `~/Dev/repos/agent-kit/` (or wherever your local checkout lives), not
  in this project.
- Bash commands that call your secrets manager (e.g. Doppler) are
  auto-approved, except destructive mutations.
- Bash commands that hit the Linear API are auto-approved, except
  destructive org/team/project/user/workspace mutations.
- Bash commands that use `agent-browser` are auto-approved.
- Notification hooks run `cc-notify.sh`.

These hooks are Claude-specific. Codex follows `AGENTS.md`, `.agents/skills`,
its own approval policy, and local Codex plugin or MCP configuration.

## Claude Skills

Shared skills live in `.agents/skills/` (most are symlinks into
`agent-kit`). The corresponding `.claude/skills/*` entries are
symlinks to those `.agents/skills/*` paths so both Claude and Codex pick
them up.

To **add a project-local skill** (one that should not propagate to other
projects), drop a real (non-symlink) directory under `.agents/skills/<name>/`.
The agent-kit `sync` step leaves non-symlink entries alone.

To **edit a shared skill**, work in `~/Dev/repos/agent-kit/skills/<name>/`
and either republish (`npm publish` + `npm update`) or use `npm link` for
hot iteration.

Claude-only behavior should stay in `.claude/` and must not duplicate
project policy from `AGENTS.md`.
