// spec: tests/test-plans/month-grid.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Initial render and grid structure', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a completely fresh state: clear localStorage before the app's scripts run
    await page.addInitScript(() => window.localStorage.clear());
    // 1. Navigate to http://localhost:5173/ with a clean localStorage
    await page.goto('http://localhost:5173/');
  });

  test('Grid renders all 5 seed habits as rows with icon and name', async ({ page }) => {
    // expect: The app loads showing the 'Month' tab active by default
    await expect(page).toHaveTitle('Habit Tracker');

    // 2. Locate the habit row labels in the grid
    // expect: Exactly 5 habit rows are present, in this order, each showing icon and name
    const habitLabels = page.locator('.habit-label');
    await expect(habitLabels).toHaveText([
      '🏃 Exercise',
      '📚 Read',
      '🧘 Meditate',
      '💧 Drink Water',
      '😴 Sleep 8 Hours',
    ]);
  });

  test('Header shows current month/year with Prev/Next controls', async ({ page }) => {
    // 2. Inspect the month header area
    // expect: A 'Previous month' button labeled '<' is visible and enabled
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeEnabled();
    // expect: The header text reads 'August 2026' (the current month/year given today=2026-08-20)
    await expect(page.getByText('August 2026')).toBeVisible();
    // expect: A 'Next month' button labeled '>' is visible and enabled
    await expect(page.getByRole('button', { name: 'Next month' })).toBeEnabled();
  });

  test('Each habit row renders one column per day of the viewed month', async ({ page }) => {
    // 2. Count the day-cell buttons in the 'Exercise' row
    // expect: Exactly 31 day cells are rendered (August has 31 days), labeled 'Exercise 2026-08-01'
    // through 'Exercise 2026-08-31' in ascending day order
    // 3. Repeat the count for the remaining 4 habit rows
    // expect: Each of the other 4 rows also renders exactly 31 day cells with the same date range,
    // labeled with their own habit name
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];

    for (const habit of habits) {
      const dayCells = page.locator(`[aria-label^="${habit} 2026-08-"]`);
      await expect(dayCells).toHaveCount(31);
      await expect(dayCells.first()).toHaveAttribute('aria-label', `${habit} 2026-08-01`);
      await expect(dayCells.last()).toHaveAttribute('aria-label', `${habit} 2026-08-31`);
    }
  });

  test('Day cells accessible name and structure', async ({ page }) => {
    // 2. Inspect a day cell button, e.g. the 'Exercise 2026-08-10' button
    // expect: The element is a <button> with class 'day-cell'
    // expect: It has aria-label '{Habit} {YYYY-MM-DD}' and aria-pressed='false' when not yet ticked
    // expect: It displays the numeric day-of-month as its visible text (e.g. '10')
    const cell = page.getByRole('button', { name: 'Exercise 2026-08-10' });
    await expect(cell).toHaveClass('day-cell');
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await expect(cell).toHaveText('10');
  });

  test('Unticked past/today cells have no accent background and full opacity', async ({ page }) => {
    // 2. Inspect the inline style of an untouched enabled cell, e.g. 'Exercise 2026-08-01'
    // expect: Opacity is 1 (full opacity)
    // expect: No background-color is set (neutral/outlined appearance, not filled with the habit's accent color)
    const cell = page.getByRole('button', { name: 'Exercise 2026-08-01' });
    await expect(cell).toHaveCSS('opacity', '1');
    await expect(cell).not.toHaveAttribute('style', /background-color/);
  });
});
