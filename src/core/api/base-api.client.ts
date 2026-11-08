import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { validateAgainstSchema } from '@helpers/schema-validator';

/**
 * Thin wrapper over Playwright's `APIRequestContext`.
 *
 * The JSON helpers accept an optional JSON Schema for the payload they return
 * and validate it before the test sees it: a missing or renamed field fails at
 * the call site with the instance path instead of surfacing later as
 * `undefined` inside an assertion. Pass the schema on every new method - the
 * parameter is optional only for endpoints whose contract has not been
 * captured in `src/schemas` yet.
 */
export abstract class BaseApiClient {
  protected constructor(protected readonly request: APIRequestContext) {}

  protected async get<T>(path: string, schema?: object): Promise<T> {
    const response = await this.request.get(path);
    await this.expectOk(response);
    const body = (await response.json()) as T;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async post<TRequest, TResponse>(path: string, payload: TRequest, schema?: object): Promise<TResponse> {
    const response = await this.request.post(path, {
      data: payload,
    });

    await this.expectOk(response);
    const body = (await response.json()) as TResponse;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async postForm<TResponse>(path: string, form: Record<string, string>, schema?: object): Promise<TResponse> {
    const response = await this.request.post(path, {
      form,
    });

    await this.expectOk(response);
    const body = (await response.json()) as TResponse;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async postMultipart<TResponse>(
    path: string,
    multipart: Record<string, string>,
    schema?: object,
  ): Promise<TResponse> {
    const response = await this.request.post(path, {
      multipart,
    });

    await this.expectOk(response);
    const body = (await response.json()) as TResponse;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async put<TRequest, TResponse>(path: string, payload: TRequest, schema?: object): Promise<TResponse> {
    const response = await this.request.put(path, {
      data: payload,
    });

    await this.expectOk(response);
    const body = (await response.json()) as TResponse;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async patch<TRequest, TResponse>(path: string, payload: TRequest, schema?: object): Promise<TResponse> {
    const response = await this.request.patch(path, {
      data: payload,
    });

    await this.expectOk(response);
    const body = (await response.json()) as TResponse;
    this.assertSchema(path, body, schema);
    return body;
  }

  protected async delete(path: string): Promise<APIResponse> {
    const response = await this.request.delete(path);
    await this.expectOk(response);
    return response;
  }

  /** No-op when the caller did not supply a schema for this endpoint. */
  private assertSchema(path: string, body: unknown, schema?: object): void {
    if (!schema) {
      return;
    }
    const errors = validateAgainstSchema(schema, body);
    if (errors.length > 0) {
      throw new Error(`${path} does not satisfy its JSON Schema: ${errors.join('; ')}`);
    }
  }

  protected async expectOk(response: APIResponse): Promise<void> {
    expect(response.ok(), `Request failed with status ${response.status()} for ${response.url()}`).toBeTruthy();
  }
}
