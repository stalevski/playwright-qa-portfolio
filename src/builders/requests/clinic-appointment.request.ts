import type { CreateClinicAppointmentDto } from '@models/api/clinic.dto';

/**
 * Fluent builder for PetHub Clinic booking requests (`POST /api/clinic/appointments`).
 *
 * Independent by design: it depends only on the request DTO, never on fixtures,
 * page objects, the test runner, or other builders. The zero-argument default
 * is a complete, valid booking the deterministic in-repo clinic store accepts
 * (service `wellness` → "Wellness check", vet `reed` → "Dr. Alex Reed", an
 * available slot). Override individual fields for variations, or drop fields
 * with {@link ClinicAppointmentRequestBuilder.without} / start from
 * {@link ClinicAppointmentRequestBuilder.blank} to exercise validation.
 */
export class ClinicAppointmentRequestBuilder {
  private appointment: CreateClinicAppointmentDto;

  constructor(seed: CreateClinicAppointmentDto = ClinicAppointmentRequestBuilder.validDefaults()) {
    this.appointment = { ...seed };
  }

  /** A complete, valid booking payload accepted by the deterministic clinic store. */
  static validDefaults(): CreateClinicAppointmentDto {
    return {
      serviceId: 'wellness',
      vetId: 'reed',
      date: '2025-06-02',
      time: '09:00',
      ownerName: 'Sam Carter',
      petName: 'Bolt',
      email: 'sam@example.com',
    };
  }

  /** Start from an empty payload to build deliberately incomplete requests. */
  static blank(): ClinicAppointmentRequestBuilder {
    return new ClinicAppointmentRequestBuilder({});
  }

  withService(serviceId: string): this {
    this.appointment.serviceId = serviceId;
    return this;
  }

  withVet(vetId: string): this {
    this.appointment.vetId = vetId;
    return this;
  }

  withDate(date: string): this {
    this.appointment.date = date;
    return this;
  }

  withTime(time: string): this {
    this.appointment.time = time;
    return this;
  }

  withOwner(ownerName: string): this {
    this.appointment.ownerName = ownerName;
    return this;
  }

  withPet(petName: string): this {
    this.appointment.petName = petName;
    return this;
  }

  withEmail(email: string): this {
    this.appointment.email = email;
    return this;
  }

  withPhone(phone: string): this {
    this.appointment.phone = phone;
    return this;
  }

  withNotes(notes: string): this {
    this.appointment.notes = notes;
    return this;
  }

  /** Remove a field to exercise required-field validation. */
  without(field: keyof CreateClinicAppointmentDto): this {
    delete this.appointment[field];
    return this;
  }

  build(): CreateClinicAppointmentDto {
    return { ...this.appointment };
  }
}
