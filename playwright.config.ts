import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { testTargets } from './test-targets.config';

dotenv.config();

const swaggerPetstoreUiBaseUrl = testTargets.swaggerPetstore.uiBaseUrl;
const swaggerPetstoreApiBaseUrl = testTargets.swaggerPetstore.apiBaseUrl;
const sauceDemoUiBaseUrl = testTargets.sauceDemo.uiBaseUrl;

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
    {
      name: 'sauce-demo-ui-chromium',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: sauceDemoUiBaseUrl },
    },
    {
      name: 'sauce-demo-ui-firefox',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], baseURL: sauceDemoUiBaseUrl },
    },
    {
      name: 'sauce-demo-ui-webkit',
      testMatch: /tests\/targets\/sauce-demo\/ui\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: sauceDemoUiBaseUrl },
    },
  ],
  outputDir: 'test-results',
});
