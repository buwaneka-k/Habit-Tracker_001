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

## Gotchas

- **`planner_setup_page` loader crash** (`test.describe()/test() did not expect to be called here`): before assuming Playwright version skew, run `/mcp` and check for a disconnected `plugin:playwright:playwright` server — reconnect it first. If that doesn't fix it, the agent can still produce an accurate plan by reading the component/seed-data/context source directly instead of a live browser snapshot.
- **`page.addInitScript(() => localStorage.clear())` re-fires on every navigation**, not just the first — including a `page.reload()` inside the test body. A shared `beforeEach` using this pattern will silently wipe state a test just set right before a reload-persistence assertion. Instead: `await page.goto(...)`, then `await page.evaluate(() => localStorage.clear())`, then `await page.reload()`.
- **`playwright-test-generator`/`playwright-test-planner` agents share a live browser session.** Running more than one at a time can interleave navigation/clicks during live verification (a generator may see another agent's month-navigation mid-exploration). Final specs using stable `getByRole`/aria-label locators aren't affected, but prefer running these agents one at a time, or expect noisy live-exploration output.