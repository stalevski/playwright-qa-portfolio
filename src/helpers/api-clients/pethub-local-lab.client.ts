import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import type { AnythingResponseDto, SamplePayloadDto, UuidResponseDto } from '@models/api/lab.dto';

export type {
  AnythingResponseDto,
  Base64DecodeDto,
  Base64EncodeDto,
  BasicAuthResponseDto,
  BearerResponseDto,
  CookiesResponseDto,
  DelayResponseDto,
  GzipResponseDto,
  HeadersResponseDto,
  SamplePayloadDto,
  StatusResponseDto,
  UuidResponseDto,
} from '@models/api/lab.dto';

/**
 * Client for the HTTP "lab" utilities at `/api/lab`. Most methods return the
 * raw {@link APIResponse} so specs can assert on status codes, headers and
 * redirects — the whole point of these endpoints.
 */
export class LocalLabApiClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async anything(method: 'get' | 'post' | 'put' | 'delete' | 'patch', body?: unknown): Promise<APIResponse> {
    return this.request[method]('lab/anything', body === undefined ? {} : { data: body });
  }

  async getHeaders(extra: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get('lab/headers', { headers: extra });
  }

  async uuid(): Promise<UuidResponseDto> {
    return this.get<UuidResponseDto>('lab/uuid');
  }

  async status(code: number): Promise<APIResponse> {
    return this.request.get(`lab/status/${code}`);
  }

  async delay(seconds: number): Promise<APIResponse> {
    return this.request.get(`lab/delay/${seconds}`);
  }

  async redirect(times: number, maxRedirects?: number): Promise<APIResponse> {
    return this.request.get(`lab/redirect/${times}`, maxRedirects === undefined ? {} : { maxRedirects });
  }

  async basicAuth(user: string, pass: string, credentials?: { user: string; pass: string }): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (credentials) {
      const encoded = Buffer.from(`${credentials.user}:${credentials.pass}`).toString('base64');
      headers.Authorization = `Basic ${encoded}`;
    }
    return this.request.get(`lab/basic-auth/${user}/${pass}`, { headers });
  }

  async bearer(token?: string): Promise<APIResponse> {
    return this.request.get('lab/bearer', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async getCookies(cookieHeader?: string): Promise<APIResponse> {
    return this.request.get('lab/cookies', {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });
  }

  async setCookie(name: string, value: string): Promise<APIResponse> {
    return this.request.get(`lab/cookies/set?name=${encodeURIComponent(name)}&value=${encodeURIComponent(value)}`, {
      maxRedirects: 0,
    });
  }

  async base64Encode(value: string): Promise<APIResponse> {
    return this.request.get(`lab/base64/encode?value=${encodeURIComponent(value)}`);
  }

  async base64Decode(value: string): Promise<APIResponse> {
    return this.request.get(`lab/base64/decode?value=${encodeURIComponent(value)}`);
  }

  async cache(etag?: string): Promise<APIResponse> {
    return this.request.get('lab/cache', {
      headers: etag ? { 'If-None-Match': etag } : {},
    });
  }

  async gzip(): Promise<APIResponse> {
    return this.request.get('lab/gzip');
  }

  async json(): Promise<SamplePayloadDto> {
    return this.get<SamplePayloadDto>('lab/json');
  }

  async xml(): Promise<APIResponse> {
    return this.request.get('lab/xml');
  }

  async html(): Promise<APIResponse> {
    return this.request.get('lab/html');
  }

  reflect(): Promise<AnythingResponseDto> {
    return this.get<AnythingResponseDto>('lab/anything');
  }
}
