import { renderAppBar, renderHead, renderStatCard } from '../http/render-helpers';

/**
 * PetHub Clinic — a self-contained veterinary appointment-booking business.
 *
 * The clinic keeps its own deterministic, in-memory store (mirroring the
 * `platform` QA surfaces) so it never touches the lowdb petstore schema and the
 * existing test suites stay green. The store is seeded at module load and reset
 * on every server start, which the local Playwright config does per run.
 */

/** Minimal HTML-escape for values interpolated into the clinic templates. */
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

export type ClinicService = { id: string; name: string; durationMinutes: number; price: number };
export type ClinicVet = { id: string; name: string; specialty: string };
export type ClinicSlot = { time: string; available: boolean };

export type ClinicAppointment = {
  reference: string;
  serviceId: string;
  serviceName: string;
  vetId: string;
  vetName: string;
  date: string;
  time: string;
  ownerName: string;
  petName: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
};

export type CreateAppointmentInput = {
  serviceId?: string;
  vetId?: string;
  date?: string;
  time?: string;
  ownerName?: string;
  petName?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type AppointmentValidationError = { field: string; message: string };

export const CLINIC_SERVICES: ClinicService[] = [
  { id: 'wellness', name: 'Wellness check', durationMinutes: 30, price: 45 },
  { id: 'vaccination', name: 'Vaccination', durationMinutes: 20, price: 35 },
  { id: 'dental', name: 'Dental cleaning', durationMinutes: 60, price: 120 },
  { id: 'grooming', name: 'Grooming', durationMinutes: 45, price: 55 },
];

export const CLINIC_VETS: ClinicVet[] = [
  { id: 'reed', name: 'Dr. Alex Reed', specialty: 'General practice' },
  { id: 'okafor', name: 'Dr. Ngozi Okafor', specialty: 'Dentistry' },
  { id: 'lindqvist', name: 'Dr. Sven Lindqvist', specialty: 'Surgery' },
];

/** Fixed daily slots; 12:00 is intentionally unavailable to exercise disabled options. */
export const CLINIC_SLOTS: ClinicSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '12:00', available: false },
  { time: '13:00', available: true },
  { time: '14:00', available: true },
];

const appointments = new Map<string, ClinicAppointment>();
let referenceCounter = 0;

const nextReference = (): string => {
  referenceCounter += 1;
  return `CLN-${String(referenceCounter).padStart(4, '0')}`;
};

const findService = (id: string | undefined): ClinicService | undefined =>
  CLINIC_SERVICES.find((service) => service.id === id);

const findVet = (id: string | undefined): ClinicVet | undefined => CLINIC_VETS.find((vet) => vet.id === id);

const isAvailableSlot = (time: string | undefined): boolean =>
  CLINIC_SLOTS.some((slot) => slot.time === time && slot.available);

const isValidEmail = (email: string | undefined): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '');

export const validateAppointment = (input: CreateAppointmentInput): AppointmentValidationError[] => {
  const errors: AppointmentValidationError[] = [];
  if (!findService(input.serviceId)) {
    errors.push({ field: 'service', message: 'Choose a service' });
  }
  if (!findVet(input.vetId)) {
    errors.push({ field: 'vet', message: 'Choose a veterinarian' });
  }
  if (!input.date || !input.date.trim()) {
    errors.push({ field: 'date', message: 'Choose a date' });
  }
  if (!isAvailableSlot(input.time)) {
    errors.push({ field: 'time', message: 'Choose an available time slot' });
  }
  if (!input.ownerName || !input.ownerName.trim()) {
    errors.push({ field: 'ownerName', message: 'Owner name is required' });
  }
  if (!input.petName || !input.petName.trim()) {
    errors.push({ field: 'petName', message: 'Pet name is required' });
  }
  if (!isValidEmail(input.email)) {
    errors.push({ field: 'email', message: 'A valid email is required' });
  }
  return errors;
};

export const createAppointment = (input: CreateAppointmentInput): ClinicAppointment => {
  const service = findService(input.serviceId);
  const vet = findVet(input.vetId);
  if (!service || !vet) {
    throw new Error('Cannot create an appointment without a valid service and veterinarian');
  }
  const reference = nextReference();
  const appointment: ClinicAppointment = {
    reference,
    serviceId: service.id,
    serviceName: service.name,
    vetId: vet.id,
    vetName: vet.name,
    date: (input.date ?? '').trim(),
    time: (input.time ?? '').trim(),
    ownerName: (input.ownerName ?? '').trim(),
    petName: (input.petName ?? '').trim(),
    email: (input.email ?? '').trim(),
    phone: (input.phone ?? '').trim(),
    notes: (input.notes ?? '').trim(),
    createdAt: new Date().toISOString(),
  };
  appointments.set(reference, appointment);
  return appointment;
};

export const listAppointments = (): ClinicAppointment[] => Array.from(appointments.values());

export const getAppointment = (reference: string): ClinicAppointment | undefined => appointments.get(reference);

const seedAppointments = (): void => {
  if (appointments.size > 0) {
    return;
  }
  createAppointment({
    serviceId: 'wellness',
    vetId: 'reed',
    date: '2025-01-06',
    time: '09:00',
    ownerName: 'Jamie Fox',
    petName: 'Rex',
    email: 'jamie@example.com',
    phone: '555-0101',
    notes: 'Annual check-up',
  });
  createAppointment({
    serviceId: 'dental',
    vetId: 'okafor',
    date: '2025-01-07',
    time: '10:00',
    ownerName: 'Pat Lee',
    petName: 'Whiskers',
    email: 'pat@example.com',
    phone: '555-0102',
    notes: '',
  });
};

seedAppointments();

const renderClinicLayout = (options: {
  title: string;
  body: string;
  activeNav: 'home' | 'book' | 'appointments';
}): string => `<!DOCTYPE html>
<html lang="en">
${renderHead(options.title)}
<body>
  <div class="shell">
    <header class="site-header">
      ${renderAppBar({
        current: 'clinic',
        title: 'PetHub Clinic',
        subtitle: 'Book and manage veterinary appointments',
      })}
      <nav class="section-nav" aria-label="Clinic sections" data-test="clinic-nav">
        <a href="/clinic" data-test="clinic-nav-home" class="${options.activeNav === 'home' ? 'active' : ''}"${
          options.activeNav === 'home' ? ' aria-current="page"' : ''
        }>Home</a>
        <a href="/clinic/book" data-test="clinic-nav-book" class="${options.activeNav === 'book' ? 'active' : ''}"${
          options.activeNav === 'book' ? ' aria-current="page"' : ''
        }>Book</a>
        <a href="/clinic/appointments" data-test="clinic-nav-appointments" class="${
          options.activeNav === 'appointments' ? 'active' : ''
        }"${options.activeNav === 'appointments' ? ' aria-current="page"' : ''}>Appointments</a>
      </nav>
    </header>
    <main>
      ${options.body}
    </main>
  </div>
  <script src="/static/clinic.js" defer></script>
</body>
</html>`;

export const renderClinicHome = (): string =>
  renderClinicLayout({
    title: 'PetHub Clinic',
    activeNav: 'home',
    body: `
      <section class="hero">
        <span class="pill">Local clinic app</span>
        <h1>PetHub Clinic</h1>
        <p>A self-contained veterinary booking business: choose a service and vet, pick a date and time slot, and confirm an appointment with a unique reference. Everything is deterministic and local, ideal for end-to-end booking automation.</p>
        <div class="row">
          <a class="button" href="/clinic/book" data-test="clinic-book-cta">Book an appointment</a>
          <a class="button secondary" href="/clinic/appointments" data-test="clinic-appointments-cta">View appointments</a>
        </div>
      </section>
      <section class="grid three-column">
        ${renderStatCard('Services offered', CLINIC_SERVICES.length)}
        ${renderStatCard('Veterinarians', CLINIC_VETS.length)}
        ${renderStatCard('Daily time slots', CLINIC_SLOTS.filter((slot) => slot.available).length)}
      </section>
      <section class="panel stack">
        <h2>Services &amp; pricing</h2>
        <ul class="list" data-test="clinic-services-list">
          ${CLINIC_SERVICES.map(
            (service) =>
              `<li class="row-between" data-test="clinic-service-row-${service.id}"><span><strong>${escapeHtml(
                service.name,
              )}</strong><br /><span class="muted">${service.durationMinutes} min</span></span><span class="muted">£${service.price}</span></li>`,
          ).join('\n          ')}
        </ul>
      </section>
      <section class="panel stack">
        <h2>Our veterinarians</h2>
        <ul class="list" data-test="clinic-vets-list">
          ${CLINIC_VETS.map(
            (vet) =>
              `<li class="row-between" data-test="clinic-vet-row-${vet.id}"><span><strong>${escapeHtml(
                vet.name,
              )}</strong></span><span class="muted">${escapeHtml(vet.specialty)}</span></li>`,
          ).join('\n          ')}
        </ul>
      </section>`,
  });

const renderServiceOptions = (selected?: string): string =>
  CLINIC_SERVICES.map(
    (service) => `
            <label class="clinic-option" data-test="clinic-service-option-${service.id}">
              <input type="radio" name="serviceId" value="${service.id}" data-test="clinic-service-${service.id}"${
                selected === service.id ? ' checked' : ''
              } />
              <span><strong>${escapeHtml(service.name)}</strong><br /><span class="muted">${
                service.durationMinutes
              } min · £${service.price}</span></span>
            </label>`,
  ).join('\n');

const renderVetOptions = (selected?: string): string =>
  CLINIC_VETS.map(
    (vet) =>
      `<option value="${vet.id}"${selected === vet.id ? ' selected' : ''}>${escapeHtml(vet.name)} — ${escapeHtml(
        vet.specialty,
      )}</option>`,
  ).join('\n            ');

const renderSlotOptions = (selected?: string): string =>
  CLINIC_SLOTS.map((slot) => {
    const id = `clinic-slot-${slot.time.replace(':', '')}`;
    return `
            <label class="clinic-slot${slot.available ? '' : ' is-unavailable'}" data-test="clinic-slot-option-${slot.time.replace(
              ':',
              '',
            )}">
              <input type="radio" name="time" value="${slot.time}" id="${id}" data-test="clinic-slot-${slot.time.replace(
                ':',
                '',
              )}"${slot.available ? '' : ' disabled'}${selected === slot.time && slot.available ? ' checked' : ''} />
              <span>${slot.time}${slot.available ? '' : ' <span class="muted">(Unavailable)</span>'}</span>
            </label>`;
  }).join('\n');

export const renderClinicBooking = (options?: {
  errors?: AppointmentValidationError[];
  values?: CreateAppointmentInput;
}): string => {
  const errors = options?.errors ?? [];
  const values = options?.values ?? {};
  return renderClinicLayout({
    title: 'PetHub Clinic — Book',
    activeNav: 'book',
    body: `
      <section class="hero">
        <h1>Book an appointment</h1>
        <p>A four-step wizard: pick a service and vet, choose a date and slot, add your details, then review and confirm.</p>
      </section>
      ${
        errors.length
          ? `<div class="error" data-test="clinic-error"><strong>Please fix the following:</strong><ul>${errors
              .map((error) => `<li>${escapeHtml(error.message)}</li>`)
              .join('')}</ul></div>`
          : ''
      }
      <form method="post" action="/clinic/book" class="panel stack" data-test="clinic-booking-form" novalidate>
        <p class="muted" data-test="clinic-step-indicator" aria-live="polite">Step 1 of 4</p>
        <p class="error" data-test="clinic-wizard-error" role="alert" hidden></p>

        <fieldset class="clinic-step" data-test="clinic-step-1">
          <legend>1. Service &amp; vet</legend>
          <div class="clinic-options">
            ${renderServiceOptions(values.serviceId)}
          </div>
          <div class="field" style="max-width:340px">
            <label for="clinic-vet-select">Veterinarian</label>
            <select id="clinic-vet-select" name="vetId" data-test="clinic-vet-select">
              <option value="">Choose a vet…</option>
              ${renderVetOptions(values.vetId)}
            </select>
          </div>
        </fieldset>

        <fieldset class="clinic-step" data-test="clinic-step-2" hidden>
          <legend>2. Date &amp; time</legend>
          <div class="field" style="max-width:240px">
            <label for="clinic-date">Preferred date</label>
            <input id="clinic-date" name="date" type="date" data-test="clinic-date" value="${escapeHtml(
              values.date ?? '',
            )}" />
          </div>
          <fieldset class="clinic-slots" data-test="clinic-slots">
            <legend class="muted">Time slot</legend>
            ${renderSlotOptions(values.time)}
          </fieldset>
        </fieldset>

        <fieldset class="clinic-step" data-test="clinic-step-3" hidden>
          <legend>3. Your details</legend>
          <div class="field" style="max-width:340px">
            <label for="clinic-owner">Owner name</label>
            <input id="clinic-owner" name="ownerName" type="text" data-test="clinic-owner" autocomplete="name" value="${escapeHtml(
              values.ownerName ?? '',
            )}" />
          </div>
          <div class="field" style="max-width:340px">
            <label for="clinic-pet">Pet name</label>
            <input id="clinic-pet" name="petName" type="text" data-test="clinic-pet" value="${escapeHtml(
              values.petName ?? '',
            )}" />
          </div>
          <div class="field" style="max-width:340px">
            <label for="clinic-email">Email</label>
            <input id="clinic-email" name="email" type="email" data-test="clinic-email" autocomplete="email" aria-describedby="clinic-email-error" value="${escapeHtml(
              values.email ?? '',
            )}" />
            <p class="field-error" id="clinic-email-error" data-test="clinic-email-error" role="alert" hidden></p>
          </div>
          <div class="field" style="max-width:340px">
            <label for="clinic-phone">Phone (optional)</label>
            <input id="clinic-phone" name="phone" type="tel" data-test="clinic-phone" autocomplete="tel" value="${escapeHtml(
              values.phone ?? '',
            )}" />
          </div>
          <div class="field" style="max-width:340px">
            <label for="clinic-notes">Notes (optional)</label>
            <textarea id="clinic-notes" name="notes" data-test="clinic-notes" rows="3">${escapeHtml(
              values.notes ?? '',
            )}</textarea>
          </div>
        </fieldset>

        <fieldset class="clinic-step" data-test="clinic-step-4" hidden>
          <legend>4. Review &amp; confirm</legend>
          <dl class="clinic-review" data-test="clinic-review">
            <div><dt>Service</dt><dd data-test="clinic-review-service">—</dd></div>
            <div><dt>Veterinarian</dt><dd data-test="clinic-review-vet">—</dd></div>
            <div><dt>Date &amp; time</dt><dd data-test="clinic-review-datetime">—</dd></div>
            <div><dt>Owner</dt><dd data-test="clinic-review-owner">—</dd></div>
            <div><dt>Pet</dt><dd data-test="clinic-review-pet">—</dd></div>
            <div><dt>Email</dt><dd data-test="clinic-review-email">—</dd></div>
          </dl>
        </fieldset>

        <div class="row clinic-wizard-controls">
          <button type="button" class="secondary" data-test="clinic-back" hidden>Back</button>
          <button type="button" data-test="clinic-next">Next</button>
          <button type="submit" data-test="clinic-confirm" hidden>Confirm appointment</button>
        </div>
      </form>`,
  });
};

export const renderClinicConfirmation = (appointment: ClinicAppointment): string =>
  renderClinicLayout({
    title: 'PetHub Clinic — Confirmed',
    activeNav: 'book',
    body: `
      <section class="hero">
        <span class="pill">Confirmed</span>
        <h1>Appointment confirmed</h1>
        <p>Keep your reference handy — you can look the appointment up on the appointments page.</p>
      </section>
      <section class="panel stack" data-test="clinic-confirmation">
        <p>Reference: <strong data-test="clinic-reference">${escapeHtml(appointment.reference)}</strong></p>
        <dl class="clinic-review">
          <div><dt>Service</dt><dd data-test="clinic-confirm-service">${escapeHtml(appointment.serviceName)}</dd></div>
          <div><dt>Veterinarian</dt><dd data-test="clinic-confirm-vet">${escapeHtml(appointment.vetName)}</dd></div>
          <div><dt>Date &amp; time</dt><dd data-test="clinic-confirm-datetime">${escapeHtml(appointment.date)} at ${escapeHtml(
            appointment.time,
          )}</dd></div>
          <div><dt>Owner</dt><dd data-test="clinic-confirm-owner">${escapeHtml(appointment.ownerName)}</dd></div>
          <div><dt>Pet</dt><dd data-test="clinic-confirm-pet">${escapeHtml(appointment.petName)}</dd></div>
          <div><dt>Email</dt><dd data-test="clinic-confirm-email">${escapeHtml(appointment.email)}</dd></div>
        </dl>
        <div class="row">
          <a class="button" href="/clinic/appointments" data-test="clinic-view-appointments">View all appointments</a>
          <a class="button secondary" href="/clinic/book" data-test="clinic-book-another">Book another</a>
        </div>
      </section>`,
  });

export const renderClinicConfirmationNotFound = (reference: string): string =>
  renderClinicLayout({
    title: 'PetHub Clinic — Not found',
    activeNav: 'appointments',
    body: `
      <section class="hero">
        <h1>Appointment not found</h1>
        <p data-test="clinic-not-found">No appointment matches reference ${escapeHtml(reference)}.</p>
        <div class="row">
          <a class="button" href="/clinic/book">Book an appointment</a>
          <a class="button secondary" href="/clinic/appointments">View appointments</a>
        </div>
      </section>`,
  });

export const renderClinicAppointments = (): string => {
  const all = listAppointments();
  return renderClinicLayout({
    title: 'PetHub Clinic — Appointments',
    activeNav: 'appointments',
    body: `
      <section class="hero">
        <h1>Appointments</h1>
        <p>Every booked appointment, newest references last.</p>
      </section>
      <section class="panel stack">
        ${
          all.length === 0
            ? `<p class="muted" data-test="clinic-appointments-empty">No appointments booked yet.</p>`
            : `<table class="table" data-test="clinic-appointments-table">
          <thead>
            <tr><th scope="col">Reference</th><th scope="col">Pet</th><th scope="col">Owner</th><th scope="col">Service</th><th scope="col">Vet</th><th scope="col">Date</th><th scope="col">Time</th></tr>
          </thead>
          <tbody>
            ${all
              .map(
                (appointment) => `<tr data-test="clinic-appointment-row" data-reference="${escapeHtml(
                  appointment.reference,
                )}">
              <td data-test="clinic-appointment-reference">${escapeHtml(appointment.reference)}</td>
              <td>${escapeHtml(appointment.petName)}</td>
              <td>${escapeHtml(appointment.ownerName)}</td>
              <td>${escapeHtml(appointment.serviceName)}</td>
              <td>${escapeHtml(appointment.vetName)}</td>
              <td>${escapeHtml(appointment.date)}</td>
              <td>${escapeHtml(appointment.time)}</td>
            </tr>`,
              )
              .join('\n            ')}
          </tbody>
        </table>`
        }
      </section>`,
  });
};
