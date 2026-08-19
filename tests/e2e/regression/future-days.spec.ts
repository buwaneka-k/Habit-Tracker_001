// spec: tests/test-plans/month-grid.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Future-day cells are non-interactive', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a completely fresh state: clear localStorage before the app's scripts run
    await page.addInitScript(() => window.localStorage.clear());
    // 1. Navigate to http://localhost:5173/ with a clean localStorage
    await page.goto('http://localhost:5173/');
  });

  test('Future-day cells in the current month render disabled with reduced opacity', async ({ page }) => {
    // 2. Inspect the cells 'Exercise 2026-08-21' through 'Exercise 2026-08-31' (days after today, 2026-08-20)
    // 3. Repeat the inspection for the other 4 habit rows' 2026-08-21 through 2026-08-31 cells
    // expect: Every one of these cells across all 5 habit rows carries the native disabled attribute,
    // has aria-pressed='false', and inline opacity of 0.4 (visibly dimmer than the 1.0 opacity of enabled cells)
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];

    for (const habit of habits) {
      for (let day = 21; day <= 31; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
        await expect(cell).toHaveAttribute('aria-pressed', 'false');
        await expect(cell).toHaveCSS('opacity', '0.4');
      }
    }
  });

  test('Clicking a future-day cell is a structural no-op', async ({ page }) => {
    // 2. Attempt to click the disabled 'Read 2026-08-25' cell (force-dispatch a click event since the
    // disabled attribute blocks a normal click)
    const cell = page.getByRole('button', { name: 'Read 2026-08-25' });
    await expect(cell).toBeDisabled();

    await cell.dispatchEvent('click');

    // expect: No click handler fires: aria-pressed remains 'false' and no background-color/fill is applied
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await expect(cell).not.toHaveAttribute('style', /background-color/);

    // 3. Read localStorage key 'habit-tracker:logs'
    // expect: No entry exists for read/2026-08-25, confirming the click had no effect on state
    const storageState = await page.context().storageState();
    const origin = storageState.origins.find((o) => o.origin === 'http://localhost:5173');
    const logsEntry = origin?.localStorage.find((item) => item.name === 'habit-tracker:logs');
    const logs = logsEntry ? JSON.parse(logsEntry.value) : {};
    expect(logs.read?.['2026-08-25']).toBeUndefined();
  });

  test('Future-day cells have no hover-triggered interactive state', async ({ page }) => {
    // 2. Hover the mouse over a disabled future cell, e.g. 'Meditate 2026-08-30'
    // expect: No hover/cursor-pointer affordance is applied and no visual state changes as a result of
    // hovering, consistent with the cell being structurally disabled rather than merely style-disabled
    const cell = page.getByRole('button', { name: 'Meditate 2026-08-30' });
    await expect(cell).toHaveCSS('cursor', 'default');
    await expect(cell).toHaveCSS('opacity', '0.4');
    await expect(cell).toHaveAttribute('aria-pressed', 'false');

    await cell.hover();

    await expect(cell).toHaveCSS('cursor', 'default');
    await expect(cell).toHaveCSS('opacity', '0.4');
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
  });

  test('The boundary day (today) is enabled while the very next day is disabled', async ({ page }) => {
    // 2. Inspect 'Exercise 2026-08-20' (today) and 'Exercise 2026-08-21' (tomorrow) side by side
    // expect: 'Exercise 2026-08-20' has no disabled attribute, opacity 1, and is clickable
    const today = page.getByRole('button', { name: 'Exercise 2026-08-20' });
    await expect(today).toBeEnabled();
    await expect(today).toHaveCSS('opacity', '1');

    // expect: 'Exercise 2026-08-21' has the disabled attribute, opacity 0.4, and is not clickable
    // expect: This confirms the future-day boundary is exactly 'date > today', not 'date >= today'
    const tomorrow = page.getByRole('button', { name: 'Exercise 2026-08-21' });
    await expect(tomorrow).toBeDisabled();
    await expect(tomorrow).toHaveCSS('opacity', '0.4');
  });
});
