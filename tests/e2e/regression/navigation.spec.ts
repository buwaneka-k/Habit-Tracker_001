// spec: tests/test-plans/month-grid.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Prev/Next month navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure a completely fresh state: clear localStorage before the app's scripts run
    await page.addInitScript(() => window.localStorage.clear());
    // 1. Navigate to http://localhost:5173/ with a clean localStorage (starts on 'August 2026')
    await page.goto('http://localhost:5173/');
  });

  test('Next button advances the header and the set of days shown', async ({ page }) => {
    // 2. Click the 'Next month' button
    await page.getByRole('button', { name: 'Next month' }).click();

    // expect: The header updates to 'September 2026'
    await expect(page.getByText('September 2026')).toBeVisible();

    // expect: The grid now renders exactly 30 day cells per habit row (September has 30 days),
    // labeled 'Exercise 2026-09-01' through 'Exercise 2026-09-30'
    const dayCells = page.locator('[aria-label^="Exercise 2026-09-"]');
    await expect(dayCells).toHaveCount(30);
    await expect(dayCells.first()).toHaveAttribute('aria-label', 'Exercise 2026-09-01');
    await expect(dayCells.last()).toHaveAttribute('aria-label', 'Exercise 2026-09-30');
  });

  test('Previous button moves the header and days back', async ({ page }) => {
    // 2. Click the 'Previous month' button once
    await page.getByRole('button', { name: 'Previous month' }).click();

    // expect: The header updates to 'July 2026'
    await expect(page.getByText('July 2026')).toBeVisible();

    // expect: The grid renders 31 day cells per row, labeled 'Exercise 2026-07-01' through 'Exercise 2026-07-31'
    const dayCells = page.locator('[aria-label^="Exercise 2026-07-"]');
    await expect(dayCells).toHaveCount(31);
    await expect(dayCells.first()).toHaveAttribute('aria-label', 'Exercise 2026-07-01');
    await expect(dayCells.last()).toHaveAttribute('aria-label', 'Exercise 2026-07-31');
  });

  test('Repeated navigation across a year boundary updates both month and year in the header', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: 'Next month' });
    const prevButton = page.getByRole('button', { name: 'Previous month' });

    // 2. Click 'Next month' 5 times in a row (Aug -> Sep -> Oct -> Nov -> Dec -> Jan)
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();

    // expect: After 4 clicks the header reads 'December 2026'
    await expect(page.getByText('December 2026')).toBeVisible();

    await nextButton.click();

    // expect: After the 5th click the header reads 'January 2027', demonstrating the year
    // increments correctly on the December-to-January rollover
    await expect(page.getByText('January 2027')).toBeVisible();

    // 3. Click 'Previous month' 5 times to return
    await prevButton.click();
    await prevButton.click();
    await prevButton.click();
    await prevButton.click();
    await prevButton.click();

    // expect: The header steps back through 'December 2026' ... to 'August 2026' again, and the
    // grid once more shows 31 days with days 1-20 enabled and 21-31 disabled, matching the
    // original initial-render state
    await expect(page.getByText('August 2026')).toBeVisible();
    const dayCells = page.locator('[aria-label^="Exercise 2026-08-"]');
    await expect(dayCells).toHaveCount(31);
    for (let day = 1; day <= 20; day++) {
      const iso = `2026-08-${String(day).padStart(2, '0')}`;
      await expect(page.getByRole('button', { name: `Exercise ${iso}` })).toBeEnabled();
    }
    for (let day = 21; day <= 31; day++) {
      const iso = `2026-08-${String(day).padStart(2, '0')}`;
      await expect(page.getByRole('button', { name: `Exercise ${iso}` })).toBeDisabled();
    }
  });

  test('Navigating across months correctly handles a 28-day February', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: 'Next month' });

    // 2. Click 'Next month' 6 times to reach 'February 2027'
    for (let i = 0; i < 6; i++) {
      await nextButton.click();
    }

    // expect: The header reads 'February 2027'
    await expect(page.getByText('February 2027')).toBeVisible();

    // expect: The grid renders exactly 28 day cells per habit row (2027 is not a leap year),
    // labeled 'Exercise 2027-02-01' through 'Exercise 2027-02-28', with no '29' cell present
    const dayCells = page.locator('[aria-label^="Exercise 2027-02-"]');
    await expect(dayCells).toHaveCount(28);
    await expect(dayCells.first()).toHaveAttribute('aria-label', 'Exercise 2027-02-01');
    await expect(dayCells.last()).toHaveAttribute('aria-label', 'Exercise 2027-02-28');
    await expect(page.locator('[aria-label="Exercise 2027-02-29"]')).toHaveCount(0);
  });

  test('Navigation does not lose previously-ticked state when moving away and back', async ({ page }) => {
    const cell = page.getByRole('button', { name: 'Exercise 2026-08-03' });

    // 1. click 'Exercise 2026-08-03' to tick it
    await cell.click();

    // expect: 'Exercise 2026-08-03' is aria-pressed='true' and filled with the accent color
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(cell).toHaveCSS('background-color', 'rgb(231, 111, 81)');

    // 2. Click 'Next month' then 'Previous month' to return to August 2026
    await page.getByRole('button', { name: 'Next month' }).click();
    await page.getByRole('button', { name: 'Previous month' }).click();

    // expect: The header again reads 'August 2026'
    await expect(page.getByText('August 2026')).toBeVisible();

    // expect: 'Exercise 2026-08-03' is still aria-pressed='true' and filled, confirming the tick
    // persisted through navigation away and back
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(cell).toHaveCSS('background-color', 'rgb(231, 111, 81)');
  });

  test('Prev/Next buttons remain enabled with no minimum/maximum month limit', async ({ page }) => {
    const prevButton = page.getByRole('button', { name: 'Previous month' });
    const nextButton = page.getByRole('button', { name: 'Next month' });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    let monthIndex = 7; // August (0-indexed), matching the initial 'August 2026' header
    let year = 2026;

    // 2. Click 'Previous month' 24 times in a row (2 years back)
    for (let i = 0; i < 24; i++) {
      await prevButton.click();
      monthIndex -= 1;
      if (monthIndex < 0) {
        monthIndex = 11;
        year -= 1;
      }
      // expect: Each click succeeds without error, the header decrements consistently each time,
      // and both 'Previous month' and 'Next month' buttons remain visible and enabled throughout
      await expect(page.getByText(`${monthNames[monthIndex]} ${year}`)).toBeVisible();
      await expect(prevButton).toBeEnabled();
      await expect(nextButton).toBeEnabled();
    }

    // 3. Click 'Next month' 48 times in a row from that point (spanning 4 years forward)
    for (let i = 0; i < 48; i++) {
      await nextButton.click();
      monthIndex += 1;
      if (monthIndex > 11) {
        monthIndex = 0;
        year += 1;
      }
      // expect: Each click succeeds without error and the header increments consistently, again
      // with no upper bound disabling the 'Next month' button
      await expect(page.getByText(`${monthNames[monthIndex]} ${year}`)).toBeVisible();
      await expect(nextButton).toBeEnabled();
      await expect(prevButton).toBeEnabled();
    }
  });
});
