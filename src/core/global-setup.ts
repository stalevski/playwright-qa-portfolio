import { request } from '@playwright/test';
import { testTargets } from '../../test-targets.config';

const localApiBaseUrl = testTargets.pethubLocal.apiBaseUrl ?? 'http://127.0.0.1:3000/api/';

/**
 * Resets the local PetHub app database before the full test run so shared
 * JSON-backed state from previous runs does not leak into fresh assertions.
 *
 * Relies on the webServer being up (Playwright starts it before globalSetup).
 * Best-effort: failures are logged but do not block the run, because
 * non-local-targeted runs can proceed without a local server.
 */
async function globalSetup(): Promise<void> {
  const context = await request.newContext({ baseURL: localApiBaseUrl });
  try {
    const response = await context.post('admin/reset', { timeout: 10_000 });
    if (!response.ok()) {
      console.warn(`[globalSetup] local DB reset returned ${response.status()}`);
    }
  } catch (error) {
    console.warn('[globalSetup] local DB reset skipped:', error instanceof Error ? error.message : error);
  } finally {
    await context.dispose();
  }
}

export default globalSetup;
