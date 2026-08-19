import { test, expect } from '@playwright/test';

test.describe('Habit Tracker seed', () => {
  test('seed', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Confirm the month grid has rendered — nav controls are always present
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next month' })).toBeVisible();

    // Confirm at least one habit row rendered with its day cells
    const firstHabit = page.getByLabel(/^.+ \d{4}-\d{2}-\d{2}$/).first();
    await expect(firstHabit).toBeVisible();
  });
});