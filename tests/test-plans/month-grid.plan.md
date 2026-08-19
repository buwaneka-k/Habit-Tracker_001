# MonthGrid Component Test Plan

## Application Overview


The Habit Tracker app (http://localhost:5173) is a frontend-only, mock-data React app with no backend, login, or roles. It has two tabs: "Month" and "Stats". This plan targets the "Month" tab's `MonthGrid` component (GitHub issue #5): a grid where rows are the 5 fixed seed habits (🏃 Exercise, 📚 Read, 🧘 Meditate, 💧 Drink Water, 😴 Sleep 8 Hours) and columns are every day of the currently-viewed month. A header shows `< Month Year >` with Prev/Next buttons that shift a locally-scoped `useState` (only the Month view, not global state). Each day cell is a `<button class="day-cell" aria-label="{HabitName} {YYYY-MM-DD}" aria-pressed="{true|false}">`. Clicking an enabled cell dispatches `TOGGLE_DAY`, flips `aria-pressed`, and fills the cell with the habit's inline `background-color` accent (e.g. Exercise = rgb(231,111,81) / #e76f51) when ticked, reverting to no background-color (opacity 1) when unticked. Cells for dates after "today" are structurally disabled: they carry the native `disabled` attribute (no click handler, not focusable/clickable), `aria-pressed="false"`, and `style="opacity: 0.4"` (vs. `opacity: 1` for enabled cells). Today's date in the test environment is 2026-08-20, so on load the grid shows August 2026 with days 1-20 enabled/clickable and 21-31 disabled. State is kept in React Context + `useReducer` and persisted to `localStorage` under the key `habit-tracker:logs` as `{ [habitId]: { [dateISO]: true } }`; only ticked days appear in that object. Note: the viewed month is local component state, so switching to the "Stats" tab and back to "Month" remounts `MonthGrid` and resets the header back to the real current month (August 2026), even if the user had navigated to a different month beforehand — this is expected behavior worth explicitly verifying, not a bug.

Assume every test starts from a completely fresh state: navigate to http://localhost:5173/, and clear localStorage (or use a fresh/incognito browser context) before each test so no prior ticks or persisted state leak between tests.


## Test Scenarios

### 1. Initial render and grid structure

**Seed:** `tests/seed.spec.ts`

#### 1.1. Grid renders all 5 seed habits as rows with icon and name

**File:** `tests/month-grid/initial-render.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
    - expect: The app loads showing the 'Month' tab active by default
    - expect: The page title is 'Habit Tracker'
  2. Locate the habit row labels in the grid
    - expect: Exactly 5 habit rows are present, in this order: '🏃 Exercise', '📚 Read', '🧘 Meditate', '💧 Drink Water', '😴 Sleep 8 Hours'
    - expect: Each row label shows both the emoji icon and the habit name

#### 1.2. Header shows current month/year with Prev/Next controls

**File:** `tests/month-grid/initial-render.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Inspect the month header area
    - expect: A 'Previous month' button labeled '<' is visible and enabled
    - expect: The header text reads 'August 2026' (the current month/year given today=2026-08-20)
    - expect: A 'Next month' button labeled '>' is visible and enabled

#### 1.3. Each habit row renders one column per day of the viewed month

**File:** `tests/month-grid/initial-render.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Count the day-cell buttons in the 'Exercise' row
    - expect: Exactly 31 day cells are rendered (August has 31 days), labeled 'Exercise 2026-08-01' through 'Exercise 2026-08-31' in ascending day order
  3. Repeat the count for the remaining 4 habit rows
    - expect: Each of the other 4 rows also renders exactly 31 day cells with the same date range, labeled with their own habit name (e.g. 'Read 2026-08-01')

#### 1.4. Day cells accessible name and structure

**File:** `tests/month-grid/initial-render.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Inspect a day cell button, e.g. the 'Exercise 2026-08-10' button
    - expect: The element is a <button> with class 'day-cell'
    - expect: It has aria-label '{Habit} {YYYY-MM-DD}' and aria-pressed='false' when not yet ticked
    - expect: It displays the numeric day-of-month as its visible text (e.g. '10')

#### 1.5. Unticked past/today cells have no accent background and full opacity

**File:** `tests/month-grid/initial-render.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Inspect the inline style of an untouched enabled cell, e.g. 'Exercise 2026-08-01'
    - expect: Opacity is 1 (full opacity)
    - expect: No background-color is set (neutral/outlined appearance, not filled with the habit's accent color)

### 2. Toggling past and today cells

**Seed:** `tests/seed.spec.ts`

#### 2.1. Clicking a past-day cell ticks it and applies the habit's accent color

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click the 'Exercise 2026-08-05' day cell (a past day relative to 2026-08-20)
    - expect: The button's aria-pressed attribute changes from 'false' to 'true'
    - expect: The button's inline background-color becomes the Exercise accent color, rgb(231, 111, 81) / #e76f51
    - expect: The button's opacity remains 1
  3. Read localStorage key 'habit-tracker:logs'
    - expect: The stored JSON contains { "exercise": { "2026-08-05": true } }

#### 2.2. Clicking a ticked cell again untoggles it

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Read 2026-08-12' once to tick it, then click it again
    - expect: After the first click, aria-pressed is 'true' and the cell is filled with Read's accent color (#457b9d / rgb(69,123,157))
    - expect: After the second click, aria-pressed reverts to 'false' and the background-color/fill is removed, opacity remains 1
  3. Read localStorage key 'habit-tracker:logs'
    - expect: The entry for read/2026-08-12 is either absent or explicitly false, reflecting the untoggled state

#### 2.3. Clicking today's cell ticks it (today is not treated as future)

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Locate and click the cell for today, 'Meditate 2026-08-20'
    - expect: The button is enabled (no disabled attribute) and clickable before the click
    - expect: After clicking, aria-pressed becomes 'true' and the cell fills with Meditate's accent color (#8e7dbe)

#### 2.4. Toggling one habit/day does not affect other habits or other days

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Drink Water 2026-08-08' to tick it
    - expect: Only 'Drink Water 2026-08-08' becomes aria-pressed='true' and filled
  3. Inspect 'Drink Water 2026-08-07', 'Drink Water 2026-08-09', and 'Exercise 2026-08-08'
    - expect: All three remain aria-pressed='false' and unfilled, confirming the toggle is scoped to exactly one habit+date pair

#### 2.5. Toggling every day of a fully-past month produces the full day count in state

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click Previous month once to go to July 2026 (fully in the past)
    - expect: Header reads 'July 2026' and all 31 day cells for every habit are enabled (none disabled, since July is entirely before 2026-08-20)
  3. Click all 31 'Sleep 8 Hours' day cells for July 2026 one by one
    - expect: Every clicked cell becomes aria-pressed='true' and filled with the Sleep 8 Hours accent color (#264653)
  4. Read localStorage key 'habit-tracker:logs'
    - expect: The 'sleep8hours' (or equivalent habit id) entry contains exactly 31 date keys for July 2026, each set to true

#### 2.6. Toggled state persists across a full page reload

**File:** `tests/month-grid/toggle-cells.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage, then click 'Exercise 2026-08-15' to tick it
    - expect: The cell shows aria-pressed='true' and the Exercise accent fill
  2. Reload the page
    - expect: The app reloads showing 'August 2026' by default
    - expect: 'Exercise 2026-08-15' still shows aria-pressed='true' and is filled with the Exercise accent color, proving the tick was persisted (localStorage) rather than only held in memory

### 3. Future-day cells are non-interactive

**Seed:** `tests/seed.spec.ts`

#### 3.1. Future-day cells in the current month render disabled with reduced opacity

**File:** `tests/month-grid/future-days.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Inspect the cells 'Exercise 2026-08-21' through 'Exercise 2026-08-31' (days after today, 2026-08-20)
    - expect: Every one of these 11 cells carries the native disabled attribute
    - expect: Each has aria-pressed='false'
    - expect: Each has inline opacity of 0.4 (visibly dimmer than the 1.0 opacity of enabled cells)
  3. Repeat the inspection for the other 4 habit rows' 2026-08-21 through 2026-08-31 cells
    - expect: All future-day cells across all 5 habit rows are disabled, aria-pressed='false', and at reduced opacity

#### 3.2. Clicking a future-day cell is a structural no-op

**File:** `tests/month-grid/future-days.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Attempt to click the disabled 'Read 2026-08-25' cell (force-dispatch a click event if the test framework's normal click is blocked by the disabled attribute)
    - expect: No click handler fires: aria-pressed remains 'false' and no background-color/fill is applied
  3. Read localStorage key 'habit-tracker:logs'
    - expect: No entry exists for read/2026-08-25, confirming the click had no effect on state

#### 3.3. Future-day cells have no hover-triggered interactive state

**File:** `tests/month-grid/future-days.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Hover the mouse over a disabled future cell, e.g. 'Meditate 2026-08-30'
    - expect: No hover/cursor-pointer affordance is applied and no visual state (e.g. fill or opacity) changes as a result of hovering, consistent with the cell being structurally disabled rather than merely style-disabled

#### 3.4. The boundary day (today) is enabled while the very next day is disabled

**File:** `tests/month-grid/future-days.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Inspect 'Exercise 2026-08-20' (today) and 'Exercise 2026-08-21' (tomorrow) side by side
    - expect: 'Exercise 2026-08-20' has no disabled attribute, opacity 1, and is clickable
    - expect: 'Exercise 2026-08-21' has the disabled attribute, opacity 0.4, and is not clickable
    - expect: This confirms the future-day boundary is exactly 'date > today', not 'date >= today'

### 4. Prev/Next month navigation

**Seed:** `tests/seed.spec.ts`

#### 4.1. Next button advances the header and the set of days shown

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage (starts on 'August 2026')
  2. Click the 'Next month' button
    - expect: The header updates to 'September 2026'
    - expect: The grid now renders exactly 30 day cells per habit row (September has 30 days), labeled 'Exercise 2026-09-01' through 'Exercise 2026-09-30'

#### 4.2. Previous button moves the header and days back

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click the 'Previous month' button once
    - expect: The header updates to 'July 2026'
    - expect: The grid renders 31 day cells per row, labeled 'Exercise 2026-07-01' through 'Exercise 2026-07-31'

#### 4.3. Repeated navigation across a year boundary updates both month and year in the header

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Next month' 5 times in a row (Aug -> Sep -> Oct -> Nov -> Dec -> Jan)
    - expect: After 4 clicks the header reads 'December 2026'
    - expect: After the 5th click the header reads 'January 2027', demonstrating the year increments correctly on the December-to-January rollover
  3. Click 'Previous month' 5 times to return
    - expect: The header steps back through 'December 2026' ... to 'August 2026' again, and the grid once more shows 31 days with days 1-20 enabled and 21-31 disabled, matching the original initial-render state

#### 4.4. Navigating across months correctly handles a 28-day February

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Next month' 6 times to reach 'February 2027'
    - expect: The header reads 'February 2027'
    - expect: The grid renders exactly 28 day cells per habit row (2027 is not a leap year), labeled 'Exercise 2027-02-01' through 'Exercise 2027-02-28', with no '29' cell present

#### 4.5. Navigation does not lose previously-ticked state when moving away and back

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage, then click 'Exercise 2026-08-03' to tick it
    - expect: 'Exercise 2026-08-03' is aria-pressed='true' and filled with the accent color
  2. Click 'Next month' then 'Previous month' to return to August 2026
    - expect: The header again reads 'August 2026'
    - expect: 'Exercise 2026-08-03' is still aria-pressed='true' and filled, confirming the tick persisted through navigation away and back

#### 4.6. Prev/Next buttons remain enabled with no minimum/maximum month limit

**File:** `tests/month-grid/navigation.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Previous month' 24 times in a row (2 years back)
    - expect: Each click succeeds without error, the header decrements consistently each time, and both 'Previous month' and 'Next month' buttons remain visible and enabled throughout (no artificial bound on how far back navigation can go)
  3. Click 'Next month' 48 times in a row from that point (spanning 4 years forward)
    - expect: Each click succeeds without error and the header increments consistently, again with no upper bound disabling the 'Next month' button

### 5. Navigating into a future month

**Seed:** `tests/seed.spec.ts`

#### 5.1. A fully future month renders the complete grid with every cell disabled

**File:** `tests/month-grid/future-month.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Next month' once to move from August 2026 to September 2026 (entirely in the future relative to 2026-08-20)
    - expect: The header reads 'September 2026'
    - expect: All 5 habit rows still render with their icon/name labels
    - expect: Every one of the 30 day cells in every row (150 cells total) has the disabled attribute, aria-pressed='false', and opacity 0.4

#### 5.2. Clicking any cell in a future month has no effect

**File:** `tests/month-grid/future-month.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage and click 'Next month' to reach September 2026
  2. Attempt to click several cells across different habits, e.g. 'Read 2026-09-01', 'Drink Water 2026-09-15', 'Sleep 8 Hours 2026-09-30' (force-dispatched if the disabled attribute blocks a normal click)
    - expect: None of the attempted clicks change aria-pressed or apply a fill color
    - expect: localStorage key 'habit-tracker:logs' remains unchanged (still empty or unaffected for these habit/date pairs)

#### 5.3. A month further in the future (e.g. next year) is also fully rendered and fully disabled

**File:** `tests/month-grid/future-month.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Next month' 12 times to reach 'August 2027'
    - expect: The header reads 'August 2027'
    - expect: The grid renders 31 day cells per habit row, all of which are disabled with opacity 0.4, since the entire month is in the future

#### 5.4. Returning from a future month to the current month re-enables the correct cells

**File:** `tests/month-grid/future-month.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage
  2. Click 'Next month' to reach September 2026 (fully disabled), then click 'Previous month' once to return to August 2026
    - expect: The header reads 'August 2026' again
    - expect: Days 1-20 are enabled (no disabled attribute, opacity 1) and days 21-31 are disabled (opacity 0.4), matching the original initial-render state exactly

#### 5.5. Switching tabs away from and back to Month resets the viewed month to the real current month

**File:** `tests/month-grid/future-month.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173/ with a clean localStorage, then click 'Next month' 3 times to reach 'November 2026'
    - expect: The header reads 'November 2026' and all cells are disabled
  2. Click the 'Stats' tab, then click the 'Month' tab to return
    - expect: The Month view no longer shows 'November 2026'; instead it resets to 'August 2026' (the real current month) with days 1-20 enabled and 21-31 disabled, since the viewed-month state is local to MonthGrid and remounts when the tab switches away and back
