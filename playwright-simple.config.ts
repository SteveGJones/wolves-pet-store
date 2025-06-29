import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright config for testing against existing running application
 * Use this when you have the app running via skaffold or manually
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false, // Run sequentially for easier debugging
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for debugging
  workers: 1, // Single worker for debugging
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Test only in Chromium for now */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Don't start webServer - assume app is already running */
  timeout: 30 * 1000,
});