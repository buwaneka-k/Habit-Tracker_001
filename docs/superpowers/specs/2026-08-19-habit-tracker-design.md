# Habit Tracker — Design Spec

Date: 2026-08-19
Status: Approved, pending implementation plan

## Purpose

A small frontend-only habit tracker: a fixed set of daily habits, ticked off day by day, with a
month view and a stats screen. Mock data only — no backend, no login, no roles, single user. Per
`docs/README.md`, the app itself doesn't need to look polished; this exercise is about how the
project is set up for AI-assisted work and how Claude is driven through the build.

Core rule (from spec): the app shows how many days in a row a habit was done (current streak), and
a future day can never be ticked.

## Tech stack

- **React + Vite + TypeScript**, scaffolded via `npm create vite@latest`.
- **Testing**: Vitest (unit tests) + React Testing Library + `@testing-library/jest-dom`
  (component tests), `jsdom` test environment.
- No routing library — a simple tab/toggle in `App` switches between the Month view and the Stats
  view. No backend, no auth.

## Project structure

```
src/
  App.tsx
  main.tsx
  habits/
    types.ts             -- Habit, HabitLogs types
    seedData.ts           -- fixed list of habits (name, icon, color)
    HabitLogContext.tsx    -- Context + reducer + localStorage sync
    streak.ts              -- pure streak calculation + future-day predicate
    streak.test.ts
  components/
    MonthGrid.tsx
    MonthGrid.test.tsx
    StatsScreen.tsx
    StatsScreen.test.tsx
```

## Data model

```ts
type Habit = { id: string; name: string; icon: string; color: string }

// logs[habitId][dateISO] = true means "done that day"
type HabitLogs = Record<string, Record<string, boolean>>
```

- Dates are keyed as `YYYY-MM-DD` strings in local time (not UTC), so grid columns map 1:1 to
  calendar days without timezone drift.
- The habit list is fixed in code (`seedData.ts`) and is **not** persisted or user-editable —
  no add/edit/delete habits UI in this version.
- `HabitLogs` starts empty (`{}`) on first load and is persisted to `localStorage` on every change.

### Seed habits

| Habit | Icon | Color |
|---|---|---|
| Exercise | 🏃 | `#e76f51` (burnt orange) |
| Read | 📚 | `#457b9d` (steel blue) |
| Meditate | 🧘 | `#8e7dbe` (soft violet) |
| Drink Water | 💧 | `#2a9d8f` (teal) |
| Sleep 8 Hours | 😴 | `#264653` (deep slate) |

## State management

React Context + `useReducer`, wrapped in a `HabitLogProvider`:

- State: `{ logs: HabitLogs }` (habits themselves come from the static `seedData.ts` import, not
  the reducer).
- Actions: `TOGGLE_DAY { habitId, dateISO }` — flips that day's boolean for that habit.
- On mount, the provider reads any saved `HabitLogs` blob from `localStorage`; if absent, it
  initializes to `{}`.
- An effect re-writes the full `logs` blob to `localStorage` whenever it changes.

No external state library — kept dependency-free since only two views share this state and a
reducer already gives testable, isolated logic for the toggle/seed behavior.

## Streak calculation (core rule)

"Current streak" is the number of consecutive days done, counting backward from today, with one
grace rule: if today has not yet been ticked, the streak still reflects the run ending
**yesterday** (so starting a new day doesn't zero out an in-progress streak before there's been a
chance to tick it). If yesterday also isn't ticked, the streak is 0.

```ts
function currentStreak(logsForHabit: Record<string, boolean>, today: Date): number {
  let cursor = isTicked(logsForHabit, today) ? today : subDays(today, 1)
  let count = 0
  while (isTicked(logsForHabit, cursor)) {
    count++
    cursor = subDays(cursor, 1)
  }
  return count
}
```

Future-day rule: `isFutureDay(date, today)` is a pure predicate (`date > today`, compared at the
day level) used to structurally disable grid cells — not just guarded in the click handler.

## Month view

- Grid: rows = the 5 seed habits (icon + name in the leading cell), columns = every day in the
  currently-viewed month.
- Header: `< Month Year >` — Prev/Next buttons shift the viewed month via local `useState` in
  `MonthGrid` (not global state; only this view cares which month it's showing).
- Cell behavior:
  - Past or today, not future → clickable; toggles that habit+date via `TOGGLE_DAY`. Filled with
    the habit's accent color when ticked; neutral outlined/empty when not.
  - Future day (`date > today`) → rendered disabled (no click handler attached, reduced opacity,
    no hover state) — this is what enforces "a future day can't be ticked."
  - Past days remain editable indefinitely (retroactive editing is allowed; the spec doesn't
    forbid it, and it's needed to produce meaningful streaks/stats while testing).
- Navigating to a future month renders the full grid (so it's visible that it's coming) with every
  cell disabled, since every day in it is in the future.

## Stats screen

- One row per habit: icon badge (in the habit's accent color) + habit name + current streak, e.g.
  "🏃 Exercise — 4 day streak" (singular "day" when the streak is exactly 1).
- Computed via the same `currentStreak()` function, reading directly from the shared
  `HabitLogContext` — no separate data-fetching.
- No other stats (no longest streak, completion rate, or totals) — a snapshot of current standing
  only, per the spec's "small stats screen."

## Visual design

- Light neutral background (off-white/light gray) with dark text, so the palette stays simple and
  the per-habit accent colors are what visually pops, rather than a busy app-wide theme competing
  with them.
- Plain CSS — no Tailwind or UI component library, since the app is small enough not to need one.
- Icons are emoji (zero dependencies, render everywhere) rather than an SVG icon library.

## Testing plan

- **Unit tests** (`streak.test.ts`):
  - `currentStreak()`: no ticks → 0; broken streak; streak ending today; streak ending yesterday
    with today untouched; today explicitly marked not-done (streak still counts from yesterday
    per the grace rule, or 0 if yesterday is also unticked).
  - `isFutureDay()`: today is not future; tomorrow is; yesterday is not.
- **Component tests**:
  - `MonthGrid`: future-day cells render disabled and clicking them is a no-op; clicking a valid
    past/today cell toggles it and updates the shared store; Prev/Next navigation changes the
    header and the set of days shown.
  - `StatsScreen`: renders each seed habit with its computed streak, using a context wrapper
    preloaded with known log data in the test.
- No dedicated reducer unit test file — `TOGGLE_DAY` and the localStorage load/save behavior are
  exercised indirectly through the component tests interacting with the real provider.

## Out of scope (YAGNI)

- Add/edit/delete habits UI — fixed seed list only.
- Longest-streak, completion-rate, or total-tick stats — current streak only.
- Routing library, backend, auth, multi-user support.
- Date-range picker or year view on the stats screen.
- Habit reordering or user-customizable icons/colors.
