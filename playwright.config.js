import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * The dev server must be running (npm run dev from repo root) before executing
 * these tests. The backend must have ALLOW_TEST_SESSION=true set so the
 * POST /api/auth/test-session endpoint is available for auth seeding.
 *
 * Run with:
 *   npx playwright test
 *
 * Or to run with UI:
 *   npx playwright test --ui
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially — tests share a DB user state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer block intentionally — requires running `npm run dev` manually first.
  // The Vite dev server and Express server must both be up.
});
