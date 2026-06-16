/**
 * Fluent builder for v2 "create pet" request bodies (`POST /api/v2/pets`).
 *
 * Independent by design: it produces a plain payload object and depends on no
 * fixtures, page objects, or the test runner. The zero-argument default is a
 * valid pet the platform API accepts; override fields with invalid or
 * boundary values — or start from {@link LocalPetRequestBuilder.blank} — to
 * exercise the endpoint's input validation.
 */
export interface LocalPetRequestBody {
  name?: unknown;
  category?: unknown;
  status?: unknown;
  price?: unknown;
  [key: string]: unknown;
}

export class LocalPetRequestBuilder {
  private body: LocalPetRequestBody;

  constructor(seed: LocalPetRequestBody = LocalPetRequestBuilder.validDefaults()) {
    this.body = { ...seed };
  }

  /** A complete, valid create-pet payload accepted by the platform API. */
  static validDefaults(): LocalPetRequestBody {
    return { name: 'Rex', category: 'Dogs', status: 'available', price: 10 };
  }

  /** Start from an empty payload to exercise the "all fields required" path. */
  static blank(): LocalPetRequestBuilder {
    return new LocalPetRequestBuilder({});
  }

  withName(name: unknown): this {
    this.body.name = name;
    return this;
  }

  withCategory(category: unknown): this {
    this.body.category = category;
    return this;
  }

  withStatus(status: unknown): this {
    this.body.status = status;
    return this;
  }

  withPrice(price: unknown): this {
    this.body.price = price;
    return this;
  }

  /** Remove a field to exercise required-field validation. */
  without(field: keyof LocalPetRequestBody): this {
    delete this.body[field];
    return this;
  }

  build(): Record<string, unknown> {
    return { ...this.body };
  }
}
