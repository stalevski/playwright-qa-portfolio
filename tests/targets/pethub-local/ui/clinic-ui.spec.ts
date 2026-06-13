import { test, expect } from '@pethub-local-fixtures';

/**
 * UI coverage for the PetHub Clinic business: the booking wizard happy path
 * (service & vet → date & time → details → review → confirm), client-side step
 * validation, review summary, back navigation, and the appointment surfacing on
 * the appointments page. The store is deterministic per server run, so tests
 * assert on the reference they create rather than absolute counts.
 */
test.describe('PetHub Clinic UI', () => {
  const details = {
    serviceId: 'wellness',
    vetId: 'reed',
    date: '2025-06-02',
    time: '09:00',
    ownerName: 'Robin Banks',
    petName: 'Pixel',
    email: 'robin@example.com',
    phone: '555-0150',
    notes: 'First visit',
  };

  test('navigates from the home page to booking', { tag: ['@smoke'] }, async ({ clinicHomePage, page }) => {
    await clinicHomePage.goto();
    await clinicHomePage.assertLoaded();
    await expect(clinicHomePage.servicesList).toBeVisible();
    await clinicHomePage.startBooking();
    await expect(page).toHaveURL(/\/clinic\/book$/);
  });

  test('books an appointment through the wizard and confirms', async ({
    clinicBookingPage,
    clinicConfirmationPage,
    clinicAppointmentsPage,
  }) => {
    await clinicBookingPage.goto();
    await clinicBookingPage.assertLoaded();
    await clinicBookingPage.book(details);

    await clinicConfirmationPage.assertLoaded();
    const reference = await clinicConfirmationPage.referenceText();
    expect(reference).toMatch(/^CLN-\d{4}$/);
    await expect(clinicConfirmationPage.service).toHaveText('Wellness check');
    await expect(clinicConfirmationPage.pet).toHaveText('Pixel');

    await clinicAppointmentsPage.goto();
    await expect(clinicAppointmentsPage.rowByReference(reference)).toBeVisible();
  });

  test('blocks advancing without a service and shows a step error', async ({ clinicBookingPage }) => {
    await clinicBookingPage.goto();
    await clinicBookingPage.next();
    await expect(clinicBookingPage.wizardError).toBeVisible();
    await expect(clinicBookingPage.wizardError).toContainText('Choose a service');
    await expect(clinicBookingPage.step(1)).toBeVisible();
    await expect(clinicBookingPage.step(2)).toBeHidden();
  });

  test('shows the entered details on the review step', async ({ clinicBookingPage }) => {
    await clinicBookingPage.goto();
    await clinicBookingPage.selectService(details.serviceId);
    await clinicBookingPage.selectVet(details.vetId);
    await clinicBookingPage.next();
    await clinicBookingPage.fillDate(details.date);
    await clinicBookingPage.chooseSlot(details.time);
    await clinicBookingPage.next();
    await clinicBookingPage.ownerInput.fill(details.ownerName);
    await clinicBookingPage.petInput.fill(details.petName);
    await clinicBookingPage.emailInput.fill(details.email);
    await clinicBookingPage.next();

    await expect(clinicBookingPage.step(4)).toBeVisible();
    await expect(clinicBookingPage.reviewService).toContainText('Wellness check');
    await expect(clinicBookingPage.reviewDatetime).toContainText('2025-06-02 at 09:00');
    await expect(clinicBookingPage.reviewOwner).toHaveText('Robin Banks');
    await expect(clinicBookingPage.confirmButton).toBeVisible();
  });

  test('steps back to a previous step', async ({ clinicBookingPage }) => {
    await clinicBookingPage.goto();
    await clinicBookingPage.selectService(details.serviceId);
    await clinicBookingPage.selectVet(details.vetId);
    await clinicBookingPage.next();
    await expect(clinicBookingPage.stepIndicator).toHaveText('Step 2 of 4');
    await clinicBookingPage.back();
    await expect(clinicBookingPage.stepIndicator).toHaveText('Step 1 of 4');
    await expect(clinicBookingPage.step(1)).toBeVisible();
  });
});
