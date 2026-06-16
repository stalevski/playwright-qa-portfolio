import { test } from '@pethub-local-fixtures';
import { assertNoSeriousA11yViolations } from '@helpers/a11y';
import { ClinicAppointmentRequestBuilder } from '@builders/requests/clinic-appointment.request';

/**
 * Accessibility baseline for the PetHub Clinic surfaces. Static pages are
 * checked in their initial rendered state; the confirmation page is checked
 * after booking an appointment via the API. Any critical or serious WCAG
 * 2.0/2.1 A + AA violation fails the suite.
 */
test.describe('PetHub Clinic accessibility', () => {
  const pages: { name: string; path: string }[] = [
    { name: 'home', path: '/clinic' },
    { name: 'booking wizard', path: '/clinic/book' },
    { name: 'appointments', path: '/clinic/appointments' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page meets the a11y baseline`, async ({ page }) => {
      await page.goto(path);
      await assertNoSeriousA11yViolations(page);
    });
  }

  test('confirmation page meets the a11y baseline', async ({ page }) => {
    const response = await page.request.post('/api/clinic/appointments', {
      data: new ClinicAppointmentRequestBuilder()
        .withService('vaccination')
        .withVet('lindqvist')
        .withDate('2025-06-03')
        .withTime('11:00')
        .withOwner('Ada Lovelace')
        .withPet('Babbage')
        .withEmail('ada@example.com')
        .build(),
    });
    const { appointment } = await response.json();
    await page.goto(`/clinic/confirmation/${appointment.reference}`);
    await assertNoSeriousA11yViolations(page);
  });
});
