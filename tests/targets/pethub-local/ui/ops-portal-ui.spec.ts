import { test, expect } from '@pethub-local-fixtures';

test.describe('PetHub Ops Portal UI', () => {
  test('overview shows the stats grid and navigation shortcuts', async ({ opsOverviewPage }) => {
    await opsOverviewPage.goto();
    await opsOverviewPage.assertLoaded();
    await opsOverviewPage.assertStatLabelsVisible([
      'Source Orders',
      'Event Feed',
      'Projection Lag Alerts',
      'Ops Health Score',
    ]);
  });

  test('navigates from overview to the work queue', async ({ opsOverviewPage, opsQueuePage }) => {
    await opsOverviewPage.goto();
    await opsOverviewPage.openQueue();
    await opsQueuePage.assertLoaded();
    await opsQueuePage.assertColumnsVisible(['Priority', 'Order', 'User', 'Source', 'Projection', 'Reason']);
    expect(await opsQueuePage.getRowCount()).toBeGreaterThan(0);
  });

  test('comparisons view exposes source, projection, and downstream sections', async ({ opsComparisonsPage }) => {
    await opsComparisonsPage.goto();
    await opsComparisonsPage.assertLoaded();
    await opsComparisonsPage.assertSignalPresent('Projection lag');
    await opsComparisonsPage.assertSignalPresent('Analytics event gap');
    await opsComparisonsPage.assertSignalPresent('Billing amount mismatch');
  });

  test('incidents catalog lists the known investigation patterns', async ({ opsIncidentsPage }) => {
    await opsIncidentsPage.goto();
    await opsIncidentsPage.assertLoaded();
    expect(await opsIncidentsPage.getIncidentCount()).toBeGreaterThanOrEqual(3);
  });

  test('opens the Projection Lag incident detail and shows the validation path', async ({
    opsIncidentsPage,
    opsIncidentDetailPage,
  }) => {
    await opsIncidentsPage.goto();
    await opsIncidentsPage.openIncident('Projection Lag on Order Status');
    await opsIncidentDetailPage.assertLoaded('Projection Lag on Order Status');
  });

  test('returns 404 layout for an unknown incident slug', async ({ page }) => {
    const response = await page.goto('/ops/incidents/does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Incident not found' })).toBeVisible();
  });
});
