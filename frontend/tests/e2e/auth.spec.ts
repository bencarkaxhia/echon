import { test, expect } from '@playwright/test';

/**
 * Auth flow tests.
 * These tests hit the real backend at localhost:8001.
 * Start backend before running: uvicorn app.main:app --reload --port 8001
 */

const TEST_EMAIL = `e2e_test_${Date.now()}@echon.test`;
const TEST_PASSWORD = 'TestPass1234!';
const TEST_NAME = 'E2E Test User';

test.describe('Login page', () => {
  test('shows validation feedback on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Enter")');
    // Either browser native validation or our own error — form should not navigate away
    await expect(page).toHaveURL('/login');
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="you@example.com"]', 'nobody@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Enter")');
    // Should stay on login or show an error — not navigate to /space
    await expect(page).not.toHaveURL(/space/);
  });
});

test.describe('Registration page', () => {
  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[placeholder="Your full name"]', TEST_NAME);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[placeholder="At least 8 characters"]', TEST_PASSWORD);
    await page.fill('input[placeholder="Re-enter password"]', 'Different1234!');
    await page.click('button[type="submit"]');
    // Should stay on register page — passwords don't match
    await expect(page).toHaveURL('/register');
  });
});

test.describe('Login → SpaceSelector flow', () => {
  test('successful login redirects away from /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="you@example.com"]', 'carkaxhiaben@gmail.com');
    await page.fill('input[type="password"]', 'test1234');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Enter")');
    // After login we go to /spaces or an entrance sequence — not staying on /login
    await expect(page).not.toHaveURL('/login', { timeout: 10_000 });
  });
});
