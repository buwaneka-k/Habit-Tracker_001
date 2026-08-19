## Playwright Agent

Use the `mcp__plugin_playwright_playwright__*` tools for all browser interactions when exploring the running app or debugging test behaviour. Always prefer these tools over guessing at selectors.

**Useful tools:**
- `browser_navigate` — navigate to a page
- `browser_snapshot` — get the accessibility tree and current DOM state (use this to discover real selectors)
- `browser_find` — search for elements by text, role, or selector
- `browser_fill_form` — fill multiple fields at once
- `browser_click`, `browser_type`, `browser_press_key`
- `browser_take_screenshot` — visual confirmation
- `browser_console_messages` — check for JS/console errors

**Always run `browser_snapshot` on the target page before writing selectors** — React re-renders components at runtime, so DOM structure and generated class names can differ from what's in the source.

## Required agents

Three specialized agents in `.claude/agents/` carry the `mcp__playwright-test__*` tools needed for browser automation. **Always invoke the matching agent — never do Playwright work inline:**

| Request type | Agent to invoke | Output |
|---|---|---|
| Create a test plan | `playwright-test-planner` | `specs/` or `tests/test-plans/` markdown |
| Generate a Playwright spec | `playwright-test-generator` | `tests/e2e/regression/*.spec.ts` |
| Debug / fix failing tests | `playwright-test-healer` | Edited spec files, green test run |

These agents are not optional — the `mcp__playwright-test__*` browser tools are only available inside them, not in the main thread.