import { Router, type Request, type Response } from 'express';
import {
  CLINIC_SERVICES,
  CLINIC_SLOTS,
  CLINIC_VETS,
  createAppointment,
  getAppointment,
  listAppointments,
  validateAppointment,
  type CreateAppointmentInput,
} from '../clinic/clinic';

/**
 * PetHub Clinic JSON API mounted at `/api/clinic`. Backed by the same
 * deterministic in-memory store as the clinic UI so API and UI bookings are
 * visible to each other within a server run.
 */
export const clinicApiRouter = Router();

clinicApiRouter.get('/services', (_request: Request, response: Response) => {
  response.json({ services: CLINIC_SERVICES });
});

clinicApiRouter.get('/vets', (_request: Request, response: Response) => {
  response.json({ vets: CLINIC_VETS });
});

clinicApiRouter.get('/slots', (request: Request, response: Response) => {
  const date = typeof request.query.date === 'string' ? request.query.date : null;
  response.json({ date, slots: CLINIC_SLOTS });
});

clinicApiRouter.post('/appointments', (request: Request, response: Response) => {
  const input = (request.body ?? {}) as CreateAppointmentInput;
  const errors = validateAppointment(input);
  if (errors.length > 0) {
    response.status(422).json({ errors });
    return;
  }
  const appointment = createAppointment(input);
  response.status(201).json({ appointment });
});

clinicApiRouter.get('/appointments', (_request: Request, response: Response) => {
  response.json({ appointments: listAppointments() });
});

clinicApiRouter.get('/appointments/:reference', (request: Request, response: Response) => {
  const appointment = getAppointment(String(request.params.reference));
  if (!appointment) {
    response.status(404).json({ error: 'Appointment not found' });
    return;
  }
  response.json({ appointment });
});
