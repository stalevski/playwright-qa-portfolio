import type { LocalPetDto } from './local.dto';

export interface VersionInfoDto {
  name: string;
  version: string;
  apiVersions: string[];
  node: string;
  startedAt: string;
}

export interface ReadinessDto {
  status: 'ready' | 'not-ready';
  checks: { database: 'up' | 'down' };
}

export type PlatformRoleDto = 'admin' | 'editor' | 'viewer';

export interface AuthTokenDto {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  role: PlatformRoleDto;
  username: string;
}

export interface AuthIdentityDto {
  username: string;
  role: PlatformRoleDto;
  expiresAt: number;
}

export interface ValidationErrorItemDto {
  field: string;
  code: 'required' | 'type' | 'enum' | 'min' | 'max' | 'maxLength';
  message: string;
}

export interface ValidationFailureDto {
  message: string;
  errors: ValidationErrorItemDto[];
}

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedPetsDto {
  data: LocalPetDto[];
  pagination: PaginationDto;
}

export interface RateLimitOkDto {
  ok: true;
  remaining: number;
}

export interface RateLimitExceededDto {
  message: string;
  retryAfter: number;
}

export interface EchoDto {
  raw: string;
  escaped: string;
}

export type JobStatusDto = 'queued' | 'running' | 'completed';

export interface JobAcceptedDto {
  jobId: string;
  status: JobStatusDto;
  type: string;
}

export interface JobStateDto {
  jobId: string;
  type: string;
  status: JobStatusDto;
  pollCount: number;
  result: Record<string, unknown> | null;
}

export interface IdempotentOrderDto {
  id: number;
  petId: number;
  userId: number;
  quantity: number;
  status: 'placed' | 'approved' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  idempotentReplay: boolean;
}
