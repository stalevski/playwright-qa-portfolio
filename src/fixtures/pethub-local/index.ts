import { test as base } from '@playwright/test';
import { LocalClinicApiClient } from '@helpers/api-clients/pethub-local-clinic.client';
import { LocalLabApiClient } from '@helpers/api-clients/pethub-local-lab.client';
import { LocalPetStoreApiClient } from '@helpers/api-clients/pethub-local-api.client';
import { LocalPlatformApiClient } from '@helpers/api-clients/pethub-local-platform.client';
import { LocalPetStorePage } from '@pages/pethub-local/home.page';
import { ClinicAppointmentsPage } from '@pages/pethub-local/clinic/clinic-appointments.page';
import { ClinicBookingPage } from '@pages/pethub-local/clinic/clinic-booking.page';
import { ClinicConfirmationPage } from '@pages/pethub-local/clinic/clinic-confirmation.page';
import { ClinicHomePage } from '@pages/pethub-local/clinic/clinic-home.page';
import { LabDialogsPage } from '@pages/pethub-local/lab/lab-dialogs.page';
import { LabDynamicPage } from '@pages/pethub-local/lab/lab-dynamic.page';
import { LabFormsPage } from '@pages/pethub-local/lab/lab-forms.page';
import { LabFramesPage } from '@pages/pethub-local/lab/lab-frames.page';
import { LabHomePage } from '@pages/pethub-local/lab/lab-home.page';
import { LabMenusPage } from '@pages/pethub-local/lab/lab-menus.page';
import { LabShadowDomPage } from '@pages/pethub-local/lab/lab-shadow-dom.page';
import { LabTablesPage } from '@pages/pethub-local/lab/lab-tables.page';
import { LabWidgetsPage } from '@pages/pethub-local/lab/lab-widgets.page';
import { OpsComparisonsPage } from '@pages/pethub-local/ops/comparisons.page';
import { OpsIncidentDetailPage } from '@pages/pethub-local/ops/incident-detail.page';
import { OpsIncidentsPage } from '@pages/pethub-local/ops/incidents.page';
import { OpsOverviewPage } from '@pages/pethub-local/ops/overview.page';
import { OpsQueuePage } from '@pages/pethub-local/ops/queue.page';
import { StorefrontCartPage } from '@pages/pethub-local/storefront/cart.page';
import { StorefrontCheckoutPage } from '@pages/pethub-local/storefront/checkout.page';
import { StorefrontCompletePage } from '@pages/pethub-local/storefront/complete.page';
import { StorefrontInventoryPage } from '@pages/pethub-local/storefront/inventory.page';
import { StorefrontItemDetailsPage } from '@pages/pethub-local/storefront/item-details.page';
import { StorefrontLoginPage } from '@pages/pethub-local/storefront/login.page';

type LocalFixtures = {
  localHomePage: LocalPetStorePage;
  localApiClient: LocalPetStoreApiClient;
  localPlatformApiClient: LocalPlatformApiClient;
  localLabApiClient: LocalLabApiClient;
  localClinicApiClient: LocalClinicApiClient;
  storefrontLoginPage: StorefrontLoginPage;
  storefrontInventoryPage: StorefrontInventoryPage;
  storefrontItemDetailsPage: StorefrontItemDetailsPage;
  storefrontCartPage: StorefrontCartPage;
  storefrontCheckoutPage: StorefrontCheckoutPage;
  storefrontCompletePage: StorefrontCompletePage;
  opsOverviewPage: OpsOverviewPage;
  opsQueuePage: OpsQueuePage;
  opsComparisonsPage: OpsComparisonsPage;
  opsIncidentsPage: OpsIncidentsPage;
  opsIncidentDetailPage: OpsIncidentDetailPage;
  labHomePage: LabHomePage;
  labFormsPage: LabFormsPage;
  labDynamicPage: LabDynamicPage;
  labDialogsPage: LabDialogsPage;
  labTablesPage: LabTablesPage;
  labWidgetsPage: LabWidgetsPage;
  labMenusPage: LabMenusPage;
  labFramesPage: LabFramesPage;
  labShadowDomPage: LabShadowDomPage;
  clinicHomePage: ClinicHomePage;
  clinicBookingPage: ClinicBookingPage;
  clinicConfirmationPage: ClinicConfirmationPage;
  clinicAppointmentsPage: ClinicAppointmentsPage;
};

export const test = base.extend<LocalFixtures>({
  localHomePage: async ({ page }, use) => {
    await use(new LocalPetStorePage(page));
  },
  localApiClient: async ({ request }, use) => {
    await use(new LocalPetStoreApiClient(request));
  },
  localPlatformApiClient: async ({ request }, use) => {
    await use(new LocalPlatformApiClient(request));
  },
  localLabApiClient: async ({ request }, use) => {
    await use(new LocalLabApiClient(request));
  },
  localClinicApiClient: async ({ request }, use) => {
    await use(new LocalClinicApiClient(request));
  },
  storefrontLoginPage: async ({ page }, use) => {
    await use(new StorefrontLoginPage(page));
  },
  storefrontInventoryPage: async ({ page }, use) => {
    await use(new StorefrontInventoryPage(page));
  },
  storefrontItemDetailsPage: async ({ page }, use) => {
    await use(new StorefrontItemDetailsPage(page));
  },
  storefrontCartPage: async ({ page }, use) => {
    await use(new StorefrontCartPage(page));
  },
  storefrontCheckoutPage: async ({ page }, use) => {
    await use(new StorefrontCheckoutPage(page));
  },
  storefrontCompletePage: async ({ page }, use) => {
    await use(new StorefrontCompletePage(page));
  },
  opsOverviewPage: async ({ page }, use) => {
    await use(new OpsOverviewPage(page));
  },
  opsQueuePage: async ({ page }, use) => {
    await use(new OpsQueuePage(page));
  },
  opsComparisonsPage: async ({ page }, use) => {
    await use(new OpsComparisonsPage(page));
  },
  opsIncidentsPage: async ({ page }, use) => {
    await use(new OpsIncidentsPage(page));
  },
  opsIncidentDetailPage: async ({ page }, use) => {
    await use(new OpsIncidentDetailPage(page));
  },
  labHomePage: async ({ page }, use) => {
    await use(new LabHomePage(page));
  },
  labFormsPage: async ({ page }, use) => {
    await use(new LabFormsPage(page));
  },
  labDynamicPage: async ({ page }, use) => {
    await use(new LabDynamicPage(page));
  },
  labDialogsPage: async ({ page }, use) => {
    await use(new LabDialogsPage(page));
  },
  labTablesPage: async ({ page }, use) => {
    await use(new LabTablesPage(page));
  },
  labWidgetsPage: async ({ page }, use) => {
    await use(new LabWidgetsPage(page));
  },
  labMenusPage: async ({ page }, use) => {
    await use(new LabMenusPage(page));
  },
  labFramesPage: async ({ page }, use) => {
    await use(new LabFramesPage(page));
  },
  labShadowDomPage: async ({ page }, use) => {
    await use(new LabShadowDomPage(page));
  },
  clinicHomePage: async ({ page }, use) => {
    await use(new ClinicHomePage(page));
  },
  clinicBookingPage: async ({ page }, use) => {
    await use(new ClinicBookingPage(page));
  },
  clinicConfirmationPage: async ({ page }, use) => {
    await use(new ClinicConfirmationPage(page));
  },
  clinicAppointmentsPage: async ({ page }, use) => {
    await use(new ClinicAppointmentsPage(page));
  },
});

export { expect } from '@playwright/test';
