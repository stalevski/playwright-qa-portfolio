import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import type {
  ClinicAppointmentResponseDto,
  ClinicAppointmentsResponseDto,
  ClinicServicesResponseDto,
  ClinicSlotsResponseDto,
  ClinicVetsResponseDto,
  CreateClinicAppointmentDto,
} from '@models/api/clinic.dto';

export type {
  ClinicAppointmentDto,
  ClinicAppointmentResponseDto,
  ClinicAppointmentsResponseDto,
  ClinicErrorsResponseDto,
  ClinicServicesResponseDto,
  ClinicSlotsResponseDto,
  ClinicVetsResponseDto,
  CreateClinicAppointmentDto,
} from '@models/api/clinic.dto';

/**
 * Client for the PetHub Clinic JSON API at `/api/clinic`. Happy-path methods
 * return typed bodies; the `*Raw` helpers return the {@link APIResponse} so
 * specs can assert on validation (422) and not-found (404) status codes.
 */
export class LocalClinicApiClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getServices(): Promise<ClinicServicesResponseDto> {
    return this.get<ClinicServicesResponseDto>('clinic/services');
  }

  async getVets(): Promise<ClinicVetsResponseDto> {
    return this.get<ClinicVetsResponseDto>('clinic/vets');
  }

  async getSlots(date?: string): Promise<ClinicSlotsResponseDto> {
    return this.get<ClinicSlotsResponseDto>(date ? `clinic/slots?date=${encodeURIComponent(date)}` : 'clinic/slots');
  }

  async createAppointment(payload: CreateClinicAppointmentDto): Promise<ClinicAppointmentResponseDto> {
    return this.post<CreateClinicAppointmentDto, ClinicAppointmentResponseDto>('clinic/appointments', payload);
  }

  async createAppointmentRaw(payload: CreateClinicAppointmentDto): Promise<APIResponse> {
    return this.request.post('clinic/appointments', { data: payload });
  }

  async listAppointments(): Promise<ClinicAppointmentsResponseDto> {
    return this.get<ClinicAppointmentsResponseDto>('clinic/appointments');
  }

  async getAppointment(reference: string): Promise<ClinicAppointmentResponseDto> {
    return this.get<ClinicAppointmentResponseDto>(`clinic/appointments/${encodeURIComponent(reference)}`);
  }

  async getAppointmentRaw(reference: string): Promise<APIResponse> {
    return this.request.get(`clinic/appointments/${encodeURIComponent(reference)}`);
  }
}
