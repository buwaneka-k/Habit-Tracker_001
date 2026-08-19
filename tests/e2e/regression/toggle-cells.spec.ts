// spec: tests/test-plans/month-grid.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Toggling past and today cells', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigate to http://localhost:5173/ with a clean localStorage
    await page.goto('http://localhost:5173/');
    // Clear any state from a prior test, then reload so the app mounts fresh.
    // (Using addInitScript here would re-clear on every later navigation in
    // this test, including the reload the persistence test performs.)
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test('Clicking a past-day cell ticks it and applies the habit\'s accent color', async ({ page }) => {
    const cell = page.getByRole('button', { name: 'Exercise 2026-08-05' });
    await expect(cell).toHaveAttribute('aria-pressed', 'false');

    // 2. Click the 'Exercise 2026-08-05' day cell (a past day relative to 2026-08-20)
    await cell.click();

    // expect: The button's aria-pressed attribute changes from 'false' to 'true'
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    // expect: The button's inline background-color becomes the Exercise accent color, rgb(231, 111, 81) / #e76f51
    await expect(cell).toHaveCSS('background-color', 'rgb(231, 111, 81)');
    // expect: The button's opacity remains 1
    await expect(cell).toHaveCSS('opacity', '1');

    // 3. Read localStorage key 'habit-tracker:logs'
    const logsRaw = await page.evaluate(() => window.localStorage.getItem('habit-tracker:logs'));
    // expect: The stored JSON contains { "exercise": { "2026-08-05": true } }
    expect(JSON.parse(logsRaw ?? '{}')).toEqual({ exercise: { '2026-08-05': true } });
  });

  test('Clicking a ticked cell again untoggles it', async ({ page }) => {
    const cell = page.getByRole('button', { name: 'Read 2026-08-12' });

    // 2. Click 'Read 2026-08-12' once to tick it, then click it again
    await cell.click();

    // expect: After the first click, aria-pressed is 'true' and the cell is filled with Read's accent color (#457b9d / rgb(69,123,157))
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(cell).toHaveCSS('background-color', 'rgb(69, 123, 157)');

    await cell.click();

    // expect: After the second click, aria-pressed reverts to 'false' and the background-color/fill is removed, opacity remains 1
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await expect(cell).not.toHaveAttribute('style', /background-color/);
    await expect(cell).toHaveCSS('opacity', '1');

    // 3. Read localStorage key 'habit-tracker:logs'
    const logsRaw = await page.evaluate(() => window.localStorage.getItem('habit-tracker:logs'));
    // expect: The entry for read/2026-08-12 is either absent or explicitly false, reflecting the untoggled state
    const logs = JSON.parse(logsRaw ?? '{}');
    expect(logs.read?.['2026-08-12'] ?? false).toBe(false);
  });

  test('Clicking today\'s cell ticks it (today is not treated as future)', async ({ page }) => {
    const cell = page.getByRole('button', { name: 'Meditate 2026-08-20' });

    // 2. Locate and click the cell for today, 'Meditate 2026-08-20'
    // expect: The button is enabled (no disabled attribute) and clickable before the click
    await expect(cell).toBeEnabled();

    await cell.click();

    // expect: After clicking, aria-pressed becomes 'true' and the cell fills with Meditate's accent color (#8e7dbe)
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(cell).toHaveCSS('background-color', 'rgb(142, 125, 190)');
  });

  test('Toggling one habit/day does not affect other habits or other days', async ({ page }) => {
    const target = page.getByRole('button', { name: 'Drink Water 2026-08-08' });

    // 2. Click 'Drink Water 2026-08-08' to tick it
    await target.click();

    // expect: Only 'Drink Water 2026-08-08' becomes aria-pressed='true' and filled
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await expect(target).toHaveCSS('background-color', 'rgb(42, 157, 143)');

    // 3. Inspect 'Drink Water 2026-08-07', 'Drink Water 2026-08-09', and 'Exercise 2026-08-08'
    const prevDay = page.getByRole('button', { name: 'Drink Water 2026-08-07' });
    const nextDay = page.getByRole('button', { name: 'Drink Water 2026-08-09' });
    const otherHabit = page.getByRole('button', { name: 'Exercise 2026-08-08' });

    // expect: All three remain aria-pressed='false' and unfilled, confirming the toggle is scoped to exactly one habit+date pair
    await expect(prevDay).toHaveAttribute('aria-pressed', 'false');
    await expect(prevDay).not.toHaveAttribute('style', /background-color/);
    await expect(nextDay).toHaveAttribute('aria-pressed', 'false');
    await expect(nextDay).not.toHaveAttribute('style', /background-color/);
    await expect(otherHabit).toHaveAttribute('aria-pressed', 'false');
    await expect(otherHabit).not.toHaveAttribute('style', /background-color/);
  });

  test('Toggling every day of a fully-past month produces the full day count in state', async ({ page }) => {
    // 2. Click Previous month once to go to July 2026 (fully in the past)
    await page.getByRole('button', { name: 'Previous month' }).click();

    // expect: Header reads 'July 2026' and all 31 day cells for every habit are enabled (none disabled)
    await expect(page.getByText('July 2026')).toBeVisible();
    const sleepCells = page.locator('[aria-label^="Sleep 8 Hours 2026-07-"]');
    await expect(sleepCells).toHaveCount(31);
    await expect(sleepCells.first()).toBeEnabled();
    await expect(sleepCells.last()).toBeEnabled();

    // 3. Click all 31 'Sleep 8 Hours' day cells for July 2026 one by one
    const count = await sleepCells.count();
    for (let i = 0; i < count; i++) {
      await sleepCells.nth(i).click();
    }

    // expect: Every clicked cell becomes aria-pressed='true' and filled with the Sleep 8 Hours accent color (#264653)
    for (let i = 0; i < count; i++) {
      await expect(sleepCells.nth(i)).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(sleepCells.first()).toHaveCSS('background-color', 'rgb(38, 70, 83)');

    // 4. Read localStorage key 'habit-tracker:logs'
    const logsRaw = await page.evaluate(() => window.localStorage.getItem('habit-tracker:logs'));
    const logs = JSON.parse(logsRaw ?? '{}');
    const sleepEntries: Record<string, boolean> = logs['sleep-8-hours'] ?? {};
    const julyKeys = Object.keys(sleepEntries).filter((date) => date.startsWith('2026-07-'));
    // expect: The 'sleep8hours' (or equivalent habit id) entry contains exactly 31 date keys for July 2026, each set to true
    expect(julyKeys).toHaveLength(31);
    expect(julyKeys.every((date) => sleepEntries[date] === true)).toBe(true);
  });

  test('Toggled state persists across a full page reload', async ({ page }) => {
    const cell = page.getByRole('button', { name: 'Exercise 2026-08-15' });

    // 1. Navigate to http://localhost:5173/ with a clean localStorage, then click 'Exercise 2026-08-15' to tick it
    await cell.click();

    // expect: The cell shows aria-pressed='true' and the Exercise accent fill
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(cell).toHaveCSS('background-color', 'rgb(231, 111, 81)');

    // 2. Reload the page
    await page.reload();

    // expect: The app reloads showing 'August 2026' by default
    await expect(page.getByText('August 2026')).toBeVisible();
    // expect: 'Exercise 2026-08-15' still shows aria-pressed='true' and is filled with the Exercise accent color
    const cellAfterReload = page.getByRole('button', { name: 'Exercise 2026-08-15' });
    await expect(cellAfterReload).toHaveAttribute('aria-pressed', 'true');
    await expect(cellAfterReload).toHaveCSS('background-color', 'rgb(231, 111, 81)');
  });
});
