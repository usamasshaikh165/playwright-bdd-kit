import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * BASE_URL comes from .env (see .env.example). The sample suite targets the
 * public Sauce Demo site so the kit runs out of the box; point BASE_URL at
 * your own application when you replace the sample specs.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://www.saucedemo.com';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['html', { open: 'never' }], ['list']],
  globalSetup: './global-setup.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
