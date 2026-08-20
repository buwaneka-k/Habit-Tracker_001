# Claude Code Setup Audit — Habit-Tracker_001

Session freshness: OK (gate checked at start of session — no mid-session config edits, no compaction, first turn of conversation).

## Summary

Overall the setup is in good shape: 8/8 enabled plugins are actually loaded, all required MCP servers are connected and authorized, CLAUDE.md structure/nesting/staleness are all clean, and no secrets or risky permission wildcards exist anywhere. 1 H, 5 M, 3 L findings total. The single most important item: the project's primary (and only) language, TypeScript/JavaScript, has no `typescript-lsp` plugin enabled, so there's zero live diagnostics/go-to-definition across the entire codebase.

## Config & Permissions

- **[H]** — none.
- **[M] [FIX]** — Zero pre-approved permissions exist in either settings file, causing constant approval-prompt friction on routine, safe commands (`git status`, `git log`, `npm run test`, `npm run lint`, read-only Playwright MCP calls) in an actively-developed project — `.claude/settings.json` / `.claude/settings.local.json` (no `permissions` key in either).
- **[L] [FIX]** — `enabledMcpjsonServers: ["playwright-test"]` is redundant now that `enableAllProjectMcpServers: true` already trusts all project MCP servers — `.claude/settings.local.json`.
- **[OK]** — `.claude/settings.json` correctly holds only team-shareable `enabledPlugins`; no misplaced hooks/permissions.
- **[OK]** — `.claude/settings.local.json` correctly holds only personal MCP-trust decisions; correctly gitignored (via the user's global gitignore, not the project's own `.gitignore` — works, but is a personal-machine dependency worth knowing about).
- **[OK]** — No `mcpServers` key in either settings file; the one server (`playwright-test`) is correctly and exclusively declared in `.mcp.json`.
- **[OK]** — No secrets, no destructive-auto-approving wildcards — neither settings file defines a `permissions` block at all, so there is nothing risky to flag.

## Plugins & Skills Coverage

- **[H] [GAP]** — TypeScript/JS is this project's sole language (root `package.json` + `tsconfig.json`, ~15 `.ts`/`.tsx` files) and no `typescript-lsp` plugin is enabled or loaded — zero live diagnostics/type-info/go-to-definition across the whole codebase. Candidate: official `typescript-lsp` on `claude-plugins-official` (same marketplace already trusted for 6 other plugins here) — actionable via `enabledPlugins` edit, though a plugin sync/restart may still be needed for it to actually load this session.
- **[M] [WARN]** — `embla-core`'s Jira/Bitbucket-shaped skills (`jira`, `deploy`, `sprint-plan`) are a partial stack mismatch: this project's `.claude/embla.json` has `tracker.jira.*` and `team.*` entirely blank and tracks work via GitHub Issues instead — only `embla-core:pr-review` is confirmed adapted for GitHub. Not fixable by a config edit; it's a usage/scope judgment call for the team.
- **[L] [WARN]** — `embla-claude-plugins` marketplace (embla-core, project-setup) appears to be this org's own internal marketplace (its name and the user's `embla.asia` email domain match, and it's the org's own tooling) rather than an unaffiliated third party — a known-vendor-shaped pattern — but provenance can't be independently confirmed from within this session beyond that signal. Nothing to edit; noted for awareness only.
- **[OK]** — All 8 entries in `enabledPlugins` have matching skills/agents/MCP tools actually visible in this session — no enabled-but-not-loaded drift, no reverse drift (unnamespaced native features aren't unaccounted-for plugin capability).
- **[OK]** — All required MCP servers connected and authorized: `playwright-test` (project `.mcp.json`), plugin-bundled Playwright MCP, and plugin-bundled GitHub MCP all expose full functional tool sets.
- **[OK]** — The two Playwright MCP servers are not redundant — `playwright-test` uniquely provides the test-authoring/execution pipeline (`test_run`, `generator_write_test`, `planner_save_plan`) the project's Playwright agents depend on, while the plugin-bundled one is generic ad-hoc browser automation.
- **[OK]** — `claude-plugins-official` is the official marketplace — highest trust tier, no reputation concern.
- **[OK]** — `github@claude-plugins-official` correctly matches this project's actual GitHub remote and GitHub-Issues tracker (confirmed via git remote and `.claude/embla.json`).
- **[OK]** — Stack detection (JS/TS only, no framework/DB/infra signals) exactly matches CLAUDE.md's declared scope ("Mock data only — no backend... single user") — no false coverage gaps to chase.

## CLAUDE.md Structure

- **[H]** — none; root `CLAUDE.md` exists on this actively-developed project.
- **[M]** — none.
- **[OK]** — `wiki/CLAUDE.md` and `tests/CLAUDE.md` each cover genuinely distinct conventions (wiki-ingest workflow; mandatory Playwright agent/MCP routing) not addressed by root, both are non-trivial real content, and both are correctly in step with their directories' actual change history (no staleness-by-signal).
- **[OK]** — Root `CLAUDE.md`'s Architecture section still matches the live `src/` layout exactly, and no `src/` commit postdates the CLAUDE.md's last touch — no staleness-by-signal. (First-impression surface check only.)
- **[OK]** — No other subfolder (`docs/`, `.claude/`, `specs/`, `claude-session-exports/`) has conventions distinct enough from root to warrant its own CLAUDE.md.
- Content quality/accuracy of any of the three CLAUDE.md files was not reviewed — that's delegated to `claude-md-management:claude-md-improver`.

## Automation Opportunities

- **[M] [GAP]** — "Always branch before committing" (CLAUDE.md) is unenforced — no git hook, no CI check — even though committing straight to `Dev` requires a disruptive history rewrite to fix; `embla-core:develop`'s own branch-gate doesn't apply here since it's Jira-entry-gated and this project uses GitHub Issues. Recommend `claude-code-setup:claude-automation-recommender` design a pre-commit hook/rule blocking direct commits to `main`/`Dev`.
- **[M] [GAP]** — GitHub issues never auto-close here (PRs merge to `Dev`, not the default `main`), and CLAUDE.md's "close finished issues manually" is a real recurring manual step with no automation covering it. Recommend `claude-code-setup:claude-automation-recommender` design a merge-triggered issue-close step using the already-enabled GitHub MCP tools.
- **[M] [GAP]** — The commit-message format (`.claude/commit-conventions.md`) is documented but unenforced — no husky/commitlint, no CI lint step exists anywhere in the repo. Recommend `claude-code-setup:claude-automation-recommender` design a commit-msg hook or CI check.
- **[L] [WARN]** — The "restart the dev server after rapid edits" gotcha is a plausible but speculative automation candidate — CLAUDE.md itself notes it was "seen once." Recommend `claude-code-setup:claude-automation-recommender` revisit only if it recurs.
- No orphaned automation: no `.claude/scripts/*` exist anywhere in this project, so nothing to check there.
- No absent-but-helpful MCP server gaps: this is a frontend-only, mock-data app with no backend/DB/infra, and its one real external dependency (GitHub) is already covered.

## What this audit didn't judge

- CLAUDE.md content accuracy/quality — see `claude-md-management:claude-md-improver`
- Concrete hook/subagent/MCP/rule design — see `claude-code-setup:claude-automation-recommender`
