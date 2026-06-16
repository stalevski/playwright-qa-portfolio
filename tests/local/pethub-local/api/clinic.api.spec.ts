import { test, expect } from '@pethub-local-fixtures';
import { ClinicAppointmentRequestBuilder } from '@builders/requests/clinic-appointment.request';
import { ValidationErrorExpectationBuilder } from '@builders/expected/validation-error.expected';

/**
 * Exercises the PetHub Clinic JSON API at `/api/clinic`: reference data
 * (services, vets, slots), the booking happy path with read-back, and the
 * validation and not-found error paths. The clinic store is in-memory and
 * deterministic per server run, so tests assert on their own created records.
 */
test.describe('PetHub Clinic API', () => {
  test('lists services, vets and slots', { tag: ['@smoke'] }, async ({ localClinicApiClient }) => {
    const services = await localClinicApiClient.getServices();
    expect(services.services.length).toBeGreaterThan(0);
    expect(services.services[0]).toHaveProperty('price');

    const vets = await localClinicApiClient.getVets();
    expect(vets.vets.length).toBeGreaterThan(0);

    const slots = await localClinicApiClient.getSlots('2025-06-02');
    expect(slots.date).toBe('2025-06-02');
    expect(slots.slots.some((slot) => slot.available)).toBeTruthy();
    expect(slots.slots.some((slot) => !slot.available)).toBeTruthy();
  });

  test('books an appointment and reads it back by reference', async ({ localClinicApiClient }) => {
    const created = await localClinicApiClient.createAppointment(new ClinicAppointmentRequestBuilder().build());
    expect(created.appointment.reference).toMatch(/^CLN-\d{4}$/);
    expect(created.appointment.serviceName).toBe('Wellness check');
    expect(created.appointment.vetName).toBe('Dr. Alex Reed');

    const fetched = await localClinicApiClient.getAppointment(created.appointment.reference);
    expect(fetched.appointment.petName).toBe('Bolt');

    const all = await localClinicApiClient.listAppointments();
    expect(all.appointments.map((appointment) => appointment.reference)).toContain(created.appointment.reference);
  });

  test('rejects an incomplete booking with 422 and field errors', async ({ localClinicApiClient }) => {
    const response = await localClinicApiClient.createAppointmentRaw(
      ClinicAppointmentRequestBuilder.blank().withService('wellness').build(),
    );
    expect(response.status()).toBe(422);

    const expected = new ValidationErrorExpectationBuilder().requiring('vet', 'email');
    const body = await response.json();
    const fields = body.errors.map((error: { field: string }) => error.field);
    expect(fields).toEqual(expect.arrayContaining(expected.fieldNames()));
  });

  test('rejects an unavailable time slot', async ({ localClinicApiClient }) => {
    const response = await localClinicApiClient.createAppointmentRaw(
      new ClinicAppointmentRequestBuilder().withTime('12:00').build(),
    );
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.errors.map((error: { field: string }) => error.field)).toContain('time');
  });

  test('returns 404 for an unknown reference', async ({ localClinicApiClient }) => {
    const response = await localClinicApiClient.getAppointmentRaw('CLN-9999');
    expect(response.status()).toBe(404);
  });
});
