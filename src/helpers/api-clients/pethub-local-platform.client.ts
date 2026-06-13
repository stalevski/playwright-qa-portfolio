import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import type { AuthIdentityDto, AuthTokenDto, PaginatedPetsDto, VersionInfoDto } from '@models/api/platform.dto';

export type {
  AuthIdentityDto,
  AuthTokenDto,
  EchoDto,
  IdempotentOrderDto,
  JobAcceptedDto,
  JobStateDto,
  JobStatusDto,
  PaginatedPetsDto,
  PaginationDto,
  RateLimitExceededDto,
  RateLimitOkDto,
  ReadinessDto,
  ValidationErrorItemDto,
  ValidationFailureDto,
  VersionInfoDto,
} from '@models/api/platform.dto';

/**
 * Client for the PetHub Local "platform" testing surfaces (auth, validation,
 * pagination, rate limiting, async jobs, idempotency, security, observability).
 *
 * Unlike {@link LocalPetStoreApiClient}, most methods return the raw
 * {@link APIResponse} so specs can assert on status codes and headers — these
 * surfaces exist precisely to exercise non-2xx behaviour (401/403/404/422/429).
 */
export class LocalPlatformApiClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  // --- Observability & contract -------------------------------------------

  async getVersion(): Promise<VersionInfoDto> {
    return this.get<VersionInfoDto>('version');
  }

  async getReady(): Promise<APIResponse> {
    return this.request.get('ready');
  }

  async getMetrics(): Promise<APIResponse> {
    return this.request.get('metrics');
  }

  async getOpenApi(): Promise<APIResponse> {
    return this.request.get('openapi.json');
  }

  // --- Auth ----------------------------------------------------------------

  async login(username: string, password: string): Promise<APIResponse> {
    return this.request.post('auth/login', { data: { username, password } });
  }

  async loginAs(username: string, password: string): Promise<AuthTokenDto> {
    return this.post<{ username: string; password: string }, AuthTokenDto>('auth/login', { username, password });
  }

  async me(token: string | undefined): Promise<APIResponse> {
    return this.request.get('auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async identity(token: string): Promise<AuthIdentityDto> {
    const response = await this.me(token);
    await this.expectOk(response);
    return response.json() as Promise<AuthIdentityDto>;
  }

  // --- v2 pets -------------------------------------------------------------

  async listPets(query: Record<string, string | number> = {}): Promise<PaginatedPetsDto> {
    const search = new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)])).toString();
    return this.get<PaginatedPetsDto>(`v2/pets${search ? `?${search}` : ''}`);
  }

  async createPetV2(body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('v2/pets', { data: body });
  }

  async deletePetV2(id: number, token: string | undefined): Promise<APIResponse> {
    return this.request.delete(`v2/pets/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // --- v2 orders (idempotent) ---------------------------------------------

  async createOrderV2(body: Record<string, unknown>, idempotencyKey?: string): Promise<APIResponse> {
    return this.request.post('v2/orders', {
      data: body,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    });
  }

  // --- Rate limiting -------------------------------------------------------

  async rateLimited(clientId: string): Promise<APIResponse> {
    return this.request.get('v2/rate-limited', { headers: { 'X-Client-Id': clientId } });
  }

  // --- Security sandbox ----------------------------------------------------

  async echo(value: string): Promise<APIResponse> {
    return this.request.get(`v2/echo?q=${encodeURIComponent(value)}`);
  }

  // --- Async jobs ----------------------------------------------------------

  async enqueueJob(type: string): Promise<APIResponse> {
    return this.request.post('jobs', { data: { type } });
  }

  async getJob(id: string): Promise<APIResponse> {
    return this.request.get(`jobs/${id}`);
  }
}
