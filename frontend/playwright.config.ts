import { defineConfig, devices } from '@playwright/test';

/**
 * Echon E2E test configuration.
 * Tests run against the local dev server (frontend:5173 + backend:8001).
 *
 * Run all:        npx playwright test
 * Run one file:   npx playwright test tests/e2e/auth.spec.ts
 * Show report:    npx playwright show-report
 * Debug UI:       npx playwright test --ui
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,       // Keep sequential — tests share a running backend
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start Vite dev server before tests (backend must already be running)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
