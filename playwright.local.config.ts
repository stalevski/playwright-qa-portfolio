import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { localAppPort, testTargets } from './test-targets.config';

dotenv.config();

const pethubLocalUiBaseUrl = testTargets.pethubLocal.uiBaseUrl;
const pethubLocalApiBaseUrl = testTargets.pethubLocal.apiBaseUrl;

/**
 * Dedicated config for the locally-hosted PetHub app.
 *
 * The local app is backed by a single shared JSON-on-disk database (lowdb)
 * which cannot tolerate concurrent writes from multiple test files. We run
 * these tests with `workers: 1` so all PetHub local UI and API specs execute
 * sequentially against one Express process and one shared database file.
 *
 * External targets (Swagger Petstore, Sauce Demo) live in `playwright.config.ts`
 * and run with full parallelism since they have no shared write state.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-local' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-test',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  webServer: {
    command: 'npm run app:start',
    url: pethubLocalUiBaseUrl,
    env: {
      APP_PORT: localAppPort,
    },
    reuseExistingServer: true,
    timeout: 120_000,
  },
  globalSetup: './src/core/global-setup.ts',
  projects: [
    {
      name: 'pethub-local-ui-chromium',
      testMatch: /tests\/targets\/pethub-local\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: pethubLocalUiBaseUrl },
    },
    {
      name: 'pethub-local-ui-firefox',
      testMatch: /tests\/targets\/pethub-local\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], baseURL: pethubLocalUiBaseUrl },
    },
    {
      name: 'pethub-local-ui-webkit',
      testMatch: /tests\/targets\/pethub-local\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: pethubLocalUiBaseUrl },
    },
    {
      name: 'pethub-local-api',
      testMatch: /tests\/targets\/pethub-local\/api\/.*\.api\.spec\.ts/,
      use: {
        baseURL: pethubLocalApiBaseUrl,
      },
    },
    /**
     * Accessibility tests for the PetHub Local app. Uses `@axe-core/playwright`
     * to assert no `critical` or `serious` WCAG 2.0/2.1 A+AA violations on the
     * admin, storefront, and ops-portal surfaces. Lower-impact issues are
     * surfaced by Axe but not enforced.
     */
    {
      name: 'pethub-local-a11y',
      testMatch: /tests\/targets\/pethub-local\/a11y\/.*\.a11y\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: pethubLocalUiBaseUrl },
    },
  ],
  outputDir: 'test-results-local',
});
