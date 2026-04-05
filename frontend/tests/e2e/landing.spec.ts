import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads and shows the Enter button', async ({ page }) => {
    await page.goto('/');
    // Landing page renders without crashing
    await expect(page).toHaveURL('/');
    // The CandleFlame SVG entrance button exists (label="Enter")
    await expect(page.getByText('Enter')).toBeVisible({ timeout: 10_000 });
  });

  test('navigating to /login renders the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();
  });

  test('navigating to /register renders the registration form', async ({ page }) => {
    await page.goto('/register');
    // Name + email + password fields
    await expect(page.getByPlaceholder('Your full name')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
  });
});
