import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { testTargets } from './test-targets.config';

dotenv.config();

const swaggerPetstoreUiBaseUrl = testTargets.swaggerPetstore.uiBaseUrl;
const swaggerPetstoreApiBaseUrl = testTargets.swaggerPetstore.apiBaseUrl;
const sauceDemoUiBaseUrl = testTargets.sauceDemo.uiBaseUrl;

/**
 * Browser state captured by `sauce-demo-setup` (logs in once as `standard_user`)
 * and reused by every `sauce-demo-ui-*` project so individual UI tests start
 * already authenticated. The file is gitignored; the setup project regenerates
 * it on every run. Hoisted to a single constant so all UI projects stay in sync.
 */
const SAUCE_DEMO_STORAGE_STATE = 'playwright/.auth/sauce-demo-standard.json';

/**
 * Default config for external targets (Swagger Petstore, Sauce Demo).
 *
 * These targets are public/demo sites with no shared mutable state owned by
 * this repo, so they run with full parallelism across browsers and files.
 *
 * The locally-hosted PetHub app has its own dedicated config at
 * `playwright.local.config.ts` because its lowdb-backed database cannot
 * tolerate concurrent writes from parallel test files.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
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
  projects: [
    {
      name: 'swagger-petstore-ui-chromium',
      testMatch: /tests\/targets\/swagger-petstore\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: swaggerPetstoreUiBaseUrl },
    },
    {
      name: 'swagger-petstore-ui-firefox',
      testMatch: /tests\/targets\/swagger-petstore\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], baseURL: swaggerPetstoreUiBaseUrl },
    },
    {
      name: 'swagger-petstore-ui-webkit',
      testMatch: /tests\/targets\/swagger-petstore\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: swaggerPetstoreUiBaseUrl },
    },
    {
      name: 'swagger-petstore-api',
      testMatch: /tests\/targets\/swagger-petstore\/api\/.*\.api\.spec\.ts/,
      use: {
        baseURL: swaggerPetstoreApiBaseUrl,
      },
    },
    /**
     * Sauce Demo auth setup: runs before any sauce-demo-ui-* project, logs in
     * once as standard_user, and writes browser state to playwright/.auth/.
     * The UI projects below load that state via `storageState` so tests start
     * already authenticated. See `tests/targets/sauce-demo/sauce-demo.setup.ts`.
     */
    {
      name: 'sauce-demo-setup',
      testMatch: /sauce-demo\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: sauceDemoUiBaseUrl },
    },
    {
      name: 'sauce-demo-ui-chromium',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      dependencies: ['sauce-demo-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: sauceDemoUiBaseUrl,
        storageState: SAUCE_DEMO_STORAGE_STATE,
      },
    },
    {
      name: 'sauce-demo-ui-firefox',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      dependencies: ['sauce-demo-setup'],
      use: {
        ...devices['Desktop Firefox'],
        baseURL: sauceDemoUiBaseUrl,
        storageState: SAUCE_DEMO_STORAGE_STATE,
      },
    },
    {
      name: 'sauce-demo-ui-webkit',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      dependencies: ['sauce-demo-setup'],
      use: {
        ...devices['Desktop Safari'],
        baseURL: sauceDemoUiBaseUrl,
        storageState: SAUCE_DEMO_STORAGE_STATE,
      },
    },
  ],
  outputDir: 'test-results',
});
