import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export abstract class BaseApiClient {
  protected constructor(protected readonly request: APIRequestContext) {}

  protected async get<T>(path: string): Promise<T> {
    const response = await this.request.get(path);
    await this.expectOk(response);
    return response.json() as Promise<T>;
  }

  protected async post<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
    const response = await this.request.post(path, {
      data: payload,
    });

    await this.expectOk(response);
    return response.json() as Promise<TResponse>;
  }

  protected async postForm<TResponse>(path: string, form: Record<string, string>): Promise<TResponse> {
    const response = await this.request.post(path, {
      form,
    });

    await this.expectOk(response);
    return response.json() as Promise<TResponse>;
  }

  protected async postMultipart<TResponse>(path: string, multipart: Record<string, string>): Promise<TResponse> {
    const response = await this.request.post(path, {
      multipart,
    });

    await this.expectOk(response);
    return response.json() as Promise<TResponse>;
  }

  protected async put<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
    const response = await this.request.put(path, {
      data: payload,
    });

    await this.expectOk(response);
    return response.json() as Promise<TResponse>;
  }

  protected async patch<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
    const response = await this.request.patch(path, {
      data: payload,
    });

    await this.expectOk(response);
    return response.json() as Promise<TResponse>;
  }

  protected async delete(path: string): Promise<APIResponse> {
    const response = await this.request.delete(path);
    await this.expectOk(response);
    return response;
  }

  protected async expectOk(response: APIResponse): Promise<void> {
    expect(response.ok(), `Request failed with status ${response.status()} for ${response.url()}`).toBeTruthy();
  }
}
