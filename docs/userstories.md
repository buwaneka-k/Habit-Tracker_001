# User Stories

Snapshot of all GitHub Issues for this repository as of 2026-08-19, including the epic. Source of truth is GitHub — this file is a point-in-time export, not a live sync.

Repo: [buwaneka-k/Habit-Tracker_001](https://github.com/buwaneka-k/Habit-Tracker_001)

---

## Epic

### [#1 — Habit Tracker MVP](https://github.com/buwaneka-k/Habit-Tracker_001/issues/1)

**Summary**

A small frontend-only habit tracker: a fixed set of daily habits, ticked off day by day, with a month view and a stats screen. Mock data only (no backend, no login, no roles, single user).

Core rule: the app shows how many days in a row a habit was done (current streak), and a future day can never be ticked.

**Spec**

Full design: `docs/superpowers/specs/2026-08-19-habit-tracker-design.md`

**Scope**

- React + Vite + TypeScript, Vitest + React Testing Library
- Fixed seed list of 5 habits (icon + accent color each), localStorage persistence
- Month grid view with Prev/Next navigation; future days structurally disabled
- Stats screen showing current streak per habit
- Context + useReducer for shared state (no external state library)

Tracked as sub-issues below.

---

## Sub-issues

### [#2 — Scaffold Vite + React + TypeScript project with Vitest/RTL test setup](https://github.com/buwaneka-k/Habit-Tracker_001/issues/2)

**Description**

Scaffold the base project so all subsequent work has a place to land.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Tech stack" and "Project structure" sections.

**Acceptance criteria**

- [ ] Project scaffolded via `npm create vite@latest` with the React + TypeScript template
- [ ] Vitest configured, plus React Testing Library and `@testing-library/jest-dom`, with `jsdom` test environment
- [ ] `src/` structure in place per the spec: `habits/` (types, seedData, HabitLogContext, streak) and `components/` (MonthGrid, StatsScreen) directories created, even if initially empty/stubbed
- [ ] `npm run dev`, `npm run build`, and the test runner all execute successfully with no errors on an empty/stub app
- [ ] No routing library added — a simple tab/toggle in `App` is sufficient per the spec

---

### [#3 — Data model, seed habits, and localStorage-backed Context/reducer](https://github.com/buwaneka-k/Habit-Tracker_001/issues/3)

**Description**

Build the shared state layer: types, fixed seed habits (with icon + color), and the Context + reducer that both views will read from.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Data model", "Seed habits", and "State management" sections.

**Acceptance criteria**

- [ ] `Habit` type (`id`, `name`, `icon`, `color`) and `HabitLogs` type (`Record<habitId, Record<dateISO, boolean>>`) defined in `habits/types.ts`
- [ ] `seedData.ts` contains the 5 fixed habits: Exercise 🏃, Read 📚, Meditate 🧘, Drink Water 💧, Sleep 8 Hours 😴, each with its accent color from the spec table
- [ ] `HabitLogContext` provides `{ logs }` state via `useReducer`, with a `TOGGLE_DAY { habitId, dateISO }` action
- [ ] On mount, logs are loaded from `localStorage` if present, else initialized to `{}`
- [ ] Every state change re-persists the full `logs` blob to `localStorage`
- [ ] Dates are keyed as local-time `YYYY-MM-DD` strings, not UTC

---

### [#4 — Streak calculation + future-day rule, with unit tests](https://github.com/buwaneka-k/Habit-Tracker_001/issues/4)

**Description**

Implement the two core rules from the spec as pure, unit-tested functions in `habits/streak.ts`.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Streak calculation (core rule)" and "Testing plan" sections.

**Acceptance criteria**

- [ ] `currentStreak(logsForHabit, today)` implemented: counts consecutive done-days backward from today; if today isn't ticked, counts backward from yesterday instead (grace rule) so an untouched "today" doesn't zero out an in-progress streak; if yesterday is also unticked, returns 0
- [ ] `isFutureDay(date, today)` implemented as a pure predicate comparing at the day level
- [ ] Unit tests in `streak.test.ts` cover: no ticks (0), broken streak, streak ending today, streak ending yesterday with today untouched, today explicitly marked not-done, and the three `isFutureDay` cases (today, tomorrow, yesterday)

---

### [#5 — Month view grid component, with component tests](https://github.com/buwaneka-k/Habit-Tracker_001/issues/5)

**Description**

Build the `MonthGrid` component: habits x days grid with Prev/Next month navigation and click-to-toggle cells.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Month view" and "Testing plan" sections. Depends on the data model/context and streak/future-day helpers from the other tasks.

**Acceptance criteria**

- [ ] Grid renders rows = the 5 seed habits (icon + name), columns = every day in the currently-viewed month
- [ ] Header shows `< Month Year >` with Prev/Next buttons controlling a local `useState` for the viewed month
- [ ] Clicking a past/today cell dispatches `TOGGLE_DAY` and updates the shared store; ticked cells are filled with the habit's accent color
- [ ] Future-day cells (`date > today`) are structurally disabled: no click handler attached, reduced opacity, no hover state
- [ ] Navigating to a future month renders the full grid with every cell disabled
- [ ] Past days remain editable indefinitely
- [ ] Component tests: future-day cells are disabled and clicking is a no-op; clicking a valid cell toggles state; Prev/Next changes the header and days shown

---

### [#6 — Stats screen component, with component tests](https://github.com/buwaneka-k/Habit-Tracker_001/issues/6)

**Description**

Build the `StatsScreen` component showing current streak per habit.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Stats screen" and "Testing plan" sections. Depends on the data model/context and streak helper from the other tasks.

**Acceptance criteria**

- [ ] Renders one row per seed habit: icon badge (in the habit's accent color) + habit name + current streak, e.g. "🏃 Exercise — 4 day streak" (singular "day" when streak is exactly 1)
- [ ] Streak computed via `currentStreak()` reading directly from the shared `HabitLogContext`
- [ ] No other stats shown (no longest streak, completion rate, or totals) — current streak only
- [ ] Component tests render each seed habit with its correct streak, using a context wrapper preloaded with known log data

---

### [#7 — Visual styling — icons, per-habit accent colors, palette](https://github.com/buwaneka-k/Habit-Tracker_001/issues/7)

**Description**

Apply the visual design across both views once they're functionally complete.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Visual design" section.

**Acceptance criteria**

- [ ] Light neutral background (off-white/light gray) with dark text as the app-wide base palette
- [ ] Each habit's accent color is used consistently: filled ticked cells in the month grid, and the icon badge on the stats screen
- [ ] Plain CSS only — no Tailwind or UI component library added
- [ ] Emoji icons render correctly for all 5 seed habits in both views
- [ ] Future-day cells are visually distinguishable (reduced opacity / no hover) from interactive cells

---

### [#15 — Wire MonthGrid and StatsScreen into App with a view toggle](https://github.com/buwaneka-k/Habit-Tracker_001/issues/15)

**Description**

#5 and #6 were built in parallel worktrees as standalone components, deliberately not wired into `App.tsx` to avoid the two branches conflicting on the same file. Now that both are merged, connect them.

**Spec reference**

`docs/superpowers/specs/2026-08-19-habit-tracker-design.md` — "Project structure": "No routing library — a simple tab/toggle in `App` switches between the Month view and the Stats view."

**Acceptance criteria**

- [ ] `App.tsx` wraps its content in `HabitLogProvider`
- [ ] A simple tab/toggle (no routing library) switches between rendering `MonthGrid` and `StatsScreen`
- [ ] Both views are reachable and functional from the running app

---

## Status note

All 8 issues above are still shown as **open** on GitHub, even though every corresponding PR has been merged. This is because the repo's default branch is `main`, but all PRs merge into `Dev` — GitHub's "Closes #N" auto-close only fires on merge to the default branch, so it never triggered here. See `CLAUDE.md` → Gotchas for details.
