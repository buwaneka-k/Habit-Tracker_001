// spec: tests/test-plans/month-grid.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Navigating into a future month', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a completely fresh state: clear localStorage before the app's scripts run
    await page.addInitScript(() => window.localStorage.clear());
    // 1. Navigate to http://localhost:5173/ with a clean localStorage
    await page.goto('http://localhost:5173/');
  });

  test('A fully future month renders the complete grid with every cell disabled', async ({ page }) => {
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];

    // 2. Click 'Next month' once to move from August 2026 to September 2026 (entirely in the future
    // relative to 2026-08-20)
    await page.getByRole('button', { name: 'Next month' }).click();

    // expect: The header reads 'September 2026'
    await expect(page.getByText('September 2026')).toBeVisible();

    // expect: All 5 habit rows still render with their icon/name labels
    await expect(page.locator('.habit-label')).toHaveText([
      '🏃 Exercise',
      '📚 Read',
      '🧘 Meditate',
      '💧 Drink Water',
      '😴 Sleep 8 Hours',
    ]);

    // expect: Every one of the 30 day cells in every row (150 cells total) has the disabled attribute,
    // aria-pressed='false', and opacity 0.4
    await expect(page.locator('.day-cell')).toHaveCount(150);

    for (const habit of habits) {
      for (let day = 1; day <= 30; day++) {
        const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
        await expect(cell).toHaveAttribute('aria-pressed', 'false');
        await expect(cell).toHaveCSS('opacity', '0.4');
      }
    }
  });

  test('Clicking any cell in a future month has no effect', async ({ page }) => {
    // 1. Navigate to http://localhost:5173/ with a clean localStorage and click 'Next month' to reach
    // September 2026
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.getByText('September 2026')).toBeVisible();

    // 2. Attempt to click several cells across different habits, e.g. 'Read 2026-09-01',
    // 'Drink Water 2026-09-15', 'Sleep 8 Hours 2026-09-30' (force-dispatched since the disabled
    // attribute blocks a normal click)
    const readCell = page.getByRole('button', { name: 'Read 2026-09-01' });
    const drinkWaterCell = page.getByRole('button', { name: 'Drink Water 2026-09-15' });
    const sleepCell = page.getByRole('button', { name: 'Sleep 8 Hours 2026-09-30' });

    await expect(readCell).toBeDisabled();
    await expect(drinkWaterCell).toBeDisabled();
    await expect(sleepCell).toBeDisabled();

    await readCell.dispatchEvent('click');
    await drinkWaterCell.dispatchEvent('click');
    await sleepCell.dispatchEvent('click');

    // expect: None of the attempted clicks change aria-pressed or apply a fill color
    await expect(readCell).toHaveAttribute('aria-pressed', 'false');
    await expect(readCell).not.toHaveAttribute('style', /background-color/);
    await expect(drinkWaterCell).toHaveAttribute('aria-pressed', 'false');
    await expect(drinkWaterCell).not.toHaveAttribute('style', /background-color/);
    await expect(sleepCell).toHaveAttribute('aria-pressed', 'false');
    await expect(sleepCell).not.toHaveAttribute('style', /background-color/);

    // expect: localStorage key 'habit-tracker:logs' remains unchanged (still empty or unaffected for
    // these habit/date pairs)
    const storageState = await page.context().storageState();
    const origin = storageState.origins.find((o) => o.origin === 'http://localhost:5173');
    const logsEntry = origin?.localStorage.find((item) => item.name === 'habit-tracker:logs');
    const logs = logsEntry ? JSON.parse(logsEntry.value) : {};
    expect(logs.read?.['2026-09-01']).toBeUndefined();
    expect(logs['drink-water']?.['2026-09-15']).toBeUndefined();
    expect(logs['sleep-8-hours']?.['2026-09-30']).toBeUndefined();
  });

  test('A month further in the future (e.g. next year) is also fully rendered and fully disabled', async ({
    page,
  }) => {
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];
    const nextButton = page.getByRole('button', { name: 'Next month' });

    // 2. Click 'Next month' 12 times to reach 'August 2027'
    for (let i = 0; i < 12; i++) {
      await nextButton.click();
    }

    // expect: The header reads 'August 2027'
    await expect(page.getByText('August 2027')).toBeVisible();

    // expect: The grid renders 31 day cells per habit row, all of which are disabled with opacity 0.4,
    // since the entire month is in the future
    for (const habit of habits) {
      const dayCells = page.locator(`[aria-label^="${habit} 2027-08-"]`);
      await expect(dayCells).toHaveCount(31);

      for (let day = 1; day <= 31; day++) {
        const dateStr = `2027-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
        await expect(cell).toHaveCSS('opacity', '0.4');
      }
    }
  });

  test('Returning from a future month to the current month re-enables the correct cells', async ({ page }) => {
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];

    // 2. Click 'Next month' to reach September 2026 (fully disabled), then click 'Previous month' once
    // to return to August 2026
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect(page.getByText('September 2026')).toBeVisible();

    await page.getByRole('button', { name: 'Previous month' }).click();

    // expect: The header reads 'August 2026' again
    await expect(page.getByText('August 2026')).toBeVisible();

    // expect: Days 1-20 are enabled (no disabled attribute, opacity 1) and days 21-31 are disabled
    // (opacity 0.4), matching the original initial-render state exactly
    for (const habit of habits) {
      for (let day = 1; day <= 20; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeEnabled();
        await expect(cell).toHaveCSS('opacity', '1');
      }

      for (let day = 21; day <= 31; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
        await expect(cell).toHaveCSS('opacity', '0.4');
      }
    }
  });

  test('Switching tabs away from and back to Month resets the viewed month to the real current month', async ({
    page,
  }) => {
    const habits = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8 Hours'];
    const nextButton = page.getByRole('button', { name: 'Next month' });

    // 1. Click 'Next month' 3 times to reach 'November 2026'
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();

    // expect: The header reads 'November 2026' and all cells are disabled
    await expect(page.getByText('November 2026')).toBeVisible();
    await expect(page.locator('.day-cell')).toHaveCount(150);

    for (const habit of habits) {
      for (let day = 1; day <= 30; day++) {
        const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
      }
    }

    // 2. Click the 'Stats' tab, then click the 'Month' tab to return
    await page.getByRole('button', { name: 'Stats' }).click();
    await page.getByRole('button', { name: 'Month' }).click();

    // expect: The Month view no longer shows 'November 2026'; instead it resets to 'August 2026' (the
    // real current month) with days 1-20 enabled and 21-31 disabled, since the viewed-month state is
    // local to MonthGrid and remounts when the tab switches away and back
    await expect(page.getByText('August 2026')).toBeVisible();
    await expect(page.getByText('November 2026')).not.toBeVisible();

    for (const habit of habits) {
      for (let day = 1; day <= 20; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeEnabled();
        await expect(cell).toHaveCSS('opacity', '1');
      }

      for (let day = 21; day <= 31; day++) {
        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
        const cell = page.getByRole('button', { name: `${habit} ${dateStr}` });
        await expect(cell).toBeDisabled();
        await expect(cell).toHaveCSS('opacity', '0.4');
      }
    }
  });
});
