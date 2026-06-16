import type { ValidationErrorItemDto } from '@models/api/platform.dto';

export type ValidationErrorCode = ValidationErrorItemDto['code'];

export type ExpectedFieldError = {
  field: string;
  code: ValidationErrorCode;
};

/**
 * Fluent builder for the *expected* shape of a 422 validation failure.
 *
 * Independent by design: it depends only on the DTO and the test runner's
 * matchers, never on fixtures, page objects, or other builders. Use
 * {@link ValidationErrorExpectationBuilder.fieldNames} for APIs that expose
 * only `{ field, message }` (the clinic store) and
 * {@link ValidationErrorExpectationBuilder.entries} /
 * {@link ValidationErrorExpectationBuilder.objectContaining} for APIs that also
 * expose a `code` (the platform API).
 */
export class ValidationErrorExpectationBuilder {
  private errors: ExpectedFieldError[] = [];

  /** Expect the given fields to be reported as missing (`code: 'required'`). */
  requiring(...fields: string[]): this {
    for (const field of fields) {
      this.errors.push({ field, code: 'required' });
    }
    return this;
  }

  /** Expect a specific field to fail with a specific validation code. */
  withFieldError(field: string, code: ValidationErrorCode): this {
    this.errors.push({ field, code });
    return this;
  }

  /** The expected field names, in insertion order. */
  fieldNames(): string[] {
    return this.errors.map((error) => error.field);
  }

  /** The expected `{ field, code }` entries, in insertion order. */
  entries(): ExpectedFieldError[] {
    return this.errors.map((error) => ({ ...error }));
  }
}
