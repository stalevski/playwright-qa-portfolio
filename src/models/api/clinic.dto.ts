export type ClinicServiceDto = { id: string; name: string; durationMinutes: number; price: number };
export type ClinicVetDto = { id: string; name: string; specialty: string };
export type ClinicSlotDto = { time: string; available: boolean };

export type ClinicAppointmentDto = {
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

export type CreateClinicAppointmentDto = {
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

export type ClinicValidationErrorDto = { field: string; message: string };

export type ClinicServicesResponseDto = { services: ClinicServiceDto[] };
export type ClinicVetsResponseDto = { vets: ClinicVetDto[] };
export type ClinicSlotsResponseDto = { date: string | null; slots: ClinicSlotDto[] };
export type ClinicAppointmentResponseDto = { appointment: ClinicAppointmentDto };
export type ClinicAppointmentsResponseDto = { appointments: ClinicAppointmentDto[] };
export type ClinicErrorsResponseDto = { errors: ClinicValidationErrorDto[] };
