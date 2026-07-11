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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --strictPort --port 5173',
    cwd: './client',
    env: {
      ...process.env,
      VITE_API_URL: 'http://127.0.0.1:5000/api'
    },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 30000
  },
  // The Express server must be up separately on port 5000 with ALLOW_TEST_SESSION=true.
});
