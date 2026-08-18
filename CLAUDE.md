# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development wiki

This repo uses Karpathy's LLM Wiki pattern as its development knowledge base.
See `wiki/CLAUDE.md` for the full wiki schema and operating instructions.

Quick reference:
- Drop new notes/decisions into `wiki/raw/` and ask Claude to ingest them
- Ask questions — Claude consults `wiki/pages/` and cites sources
- Run lint periodically: "lint the wiki"
- `wiki/raw/` is read-only. Never modify files there.
- `wiki/pages/` is LLM-owned. Only Claude writes there.

## Design specs

When brainstorming or designing a feature, save the spec to:

```
wiki/raw/specs/YYYY-MM-DD-<topic>-design.md
```

## Project status

This repository is currently a blank slate: no application code, package manifest, or build tooling exists yet (see `docs/README.md` for the full spec). There are no build/lint/test commands to run because no project has been scaffolded. When scaffolding the project, pick a stack appropriate for a small frontend-only app and update this file with the actual build/lint/test/dev commands once they exist.

## What to build

A small frontend-only habit tracker:
- A handful of daily habits, ticked off day by day.
- A month view and a small stats screen.
- Mock data only — no backend, no login, no roles, single user.
- The UI does not need to look polished. This exercise is about how the project is set up for AI-assisted work and how Claude is driven through the build, not visual design.

Core rule: the app must show how many consecutive days in a row a habit was completed (a streak), and a future day can never be ticked.

## Workflow conventions

- **Issue tracking**: GitHub Issues (not Jira) — see `.claude/embla.json`.
- **Branch naming** (`.claude/branch-conventions.md`):
  - `feature/{issue}-{short-description}`
  - `bug/{issue}-{short-description}`
  - `hotfix/{issue}-{short-description}`
  - `release/v{version}`
  - Short description: kebab-case, 3-5 words, describes the change not the ticket number.
- **Commit messages** (`.claude/commit-conventions.md`):
  - Format: `{type}({scope}): #{issue} {description}`
  - Example: `feat(auth): #12 add JWT login endpoint`
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`.
  - Imperative mood, lowercase first letter, no trailing period, description under 72 characters.
  - Include the GitHub issue number when the commit closes or progresses an issue.
- Main/production branch is `main`; day-to-day work happens on `Dev`.
