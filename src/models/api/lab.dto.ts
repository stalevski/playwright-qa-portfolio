export interface AnythingResponseDto {
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: unknown;
  contentType: string | null;
}

export interface HeadersResponseDto {
  headers: Record<string, string>;
}

export interface UuidResponseDto {
  uuid: string;
}

export interface StatusResponseDto {
  status: number;
  statusText: string;
}

export interface DelayResponseDto {
  delayedSeconds: number;
}

export interface BasicAuthResponseDto {
  authenticated: boolean;
  user?: string;
}

export interface BearerResponseDto {
  authenticated: boolean;
  token?: string;
}

export interface CookiesResponseDto {
  cookies: Record<string, string>;
}

export interface Base64EncodeDto {
  value: string;
  encoded: string;
}

export interface Base64DecodeDto {
  value: string;
  decoded: string;
}

export interface SamplePayloadDto {
  id: number;
  title: string;
  active: boolean;
  tags: string[];
}

export interface GzipResponseDto extends SamplePayloadDto {
  gzipped: boolean;
}
