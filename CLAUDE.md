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
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
```

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server
npm run build     # type-check (tsc -b) + production build
npm run test      # run Vitest suite once
npm run test:watch  # Vitest watch mode
npm run lint      # oxlint
```

## Architecture

- `src/App.tsx` — top-level component, wrapped in `HabitLogProvider`. No routing library; a `useState`-backed tab toggle switches between `MonthGrid` and `StatsScreen`.
- `src/App.css` — app-wide light-neutral palette plus structural classes (`.tabs`, `.month-header`, `.habit-row`, `.day-cell`, `.stats-list`, `.icon-badge`, etc.). Per-habit accent colors and future-day opacity stay as inline dynamic styles in the components; the stylesheet only handles static structure/palette.
- `src/habits/` — shared data layer: `types.ts` (Habit/HabitLogs types), `seedData.ts` (fixed seed habits), `HabitLogContext.tsx` (Context + reducer + localStorage sync), `streak.ts` (streak + future-day-rule logic).
- `src/components/` — `MonthGrid.tsx` (habit × day grid with Prev/Next navigation) and `StatsScreen.tsx` (current streak per habit).
- Full design: `docs/superpowers/specs/2026-08-19-habit-tracker-design.md`.
- `docs/reviews/` — pr-review reports (one per reviewed PR), written by the `embla-core:pr-review` skill adapted to GitHub (see Gotchas).

## Gotchas

- **Vite/Vitest version pin**: `vite` is pinned to `^7` and `@vitejs/plugin-react` to `^5.2` in `package.json`. `vite@8` (rolldown-based) only works with `@vitejs/plugin-react@6`, but `vitest@3.2.7`'s peer range is `vite ^5‖^6‖^7`. Bumping `vite` or `@vitejs/plugin-react` past those pins without also bumping `vitest` reintroduces a duplicate, type-incompatible `vite` install and breaks `tsc -b` in `npm run build`.
- **jest-dom matchers**: `src/setupTests.ts` imports `@testing-library/jest-dom/vitest` (not the plain `@testing-library/jest-dom` root import) — this is what gives Vitest's `expect` the correct TypeScript types for matchers like `.toBeInTheDocument()`.
- **RTL auto-cleanup**: `vite.config.ts` does not set `test.globals: true`, so React Testing Library's automatic per-test `cleanup()` never registers (it needs a global `afterEach`). `src/setupTests.ts` explicitly imports `cleanup` and registers it in `afterEach` — without this, a test file with more than one `render()` call gets duplicate DOM across tests and spurious "multiple elements" failures.
- **GitHub issue auto-close needs the default branch**: this repo's default branch is `main`, but all feature PRs merge into `Dev`. GitHub's "Closes #N" keyword only auto-closes an issue when the linked PR merges into the repository's *default* branch — so issues never auto-close here despite every PR body saying "Closes #N". Close finished issues manually, or account for this before assuming an issue's state reflects reality.
- **Dev-server HMR can go stale across many edits**: after several rapid file edits in one long-running `npm run dev` session, the page can show stale/duplicated behavior unrelated to the actual code (seen once during manual browser verification). Restart the dev server before trusting a surprising manual-verification result.
- **`gh` CLI is unavailable in this environment's Bash tool** (`gh: command not found`) — use the GitHub MCP tools (`mcp__plugin_github_github__*`, e.g. `create_pull_request`, `issue_write`) for PR and issue operations instead.
- **Always branch before committing, even for small additions**: committing straight to `Dev` breaks the feature→Dev PR convention. Fixing it after the fact requires reverting the direct commit on `Dev` and recreating the work on a proper `feature/*` branch — a disruptive history rewrite. Create the branch first.

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
