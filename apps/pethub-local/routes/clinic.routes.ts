import { Router, type Request, type Response } from 'express';
import {
  createAppointment,
  getAppointment,
  renderClinicAppointments,
  renderClinicBooking,
  renderClinicConfirmation,
  renderClinicConfirmationNotFound,
  renderClinicHome,
  validateAppointment,
  type CreateAppointmentInput,
} from '../clinic/clinic';

export const clinicRouter = Router();

const readAppointmentInput = (request: Request): CreateAppointmentInput => ({
  serviceId: typeof request.body.serviceId === 'string' ? request.body.serviceId : undefined,
  vetId: typeof request.body.vetId === 'string' ? request.body.vetId : undefined,
  date: typeof request.body.date === 'string' ? request.body.date : undefined,
  time: typeof request.body.time === 'string' ? request.body.time : undefined,
  ownerName: typeof request.body.ownerName === 'string' ? request.body.ownerName : undefined,
  petName: typeof request.body.petName === 'string' ? request.body.petName : undefined,
  email: typeof request.body.email === 'string' ? request.body.email : undefined,
  phone: typeof request.body.phone === 'string' ? request.body.phone : undefined,
  notes: typeof request.body.notes === 'string' ? request.body.notes : undefined,
});

clinicRouter.get('/', (_request: Request, response: Response) => {
  response.send(renderClinicHome());
});

clinicRouter.get('/book', (_request: Request, response: Response) => {
  response.send(renderClinicBooking());
});

clinicRouter.post('/book', (request: Request, response: Response) => {
  const values = readAppointmentInput(request);
  const errors = validateAppointment(values);
  if (errors.length > 0) {
    response.status(400).send(renderClinicBooking({ errors, values }));
    return;
  }
  const appointment = createAppointment(values);
  response.redirect(`/clinic/confirmation/${appointment.reference}`);
});

clinicRouter.get('/confirmation/:reference', (request: Request, response: Response) => {
  const reference = String(request.params.reference);
  const appointment = getAppointment(reference);
  if (!appointment) {
    response.status(404).send(renderClinicConfirmationNotFound(reference));
    return;
  }
  response.send(renderClinicConfirmation(appointment));
});

clinicRouter.get('/appointments', (_request: Request, response: Response) => {
  response.send(renderClinicAppointments());
});
