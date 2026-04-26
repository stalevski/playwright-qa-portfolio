import { test, expect } from '@swagger-petstore-fixtures';
import { createPetDto } from '@helpers/test-data';

test.describe('Petstore API - Pet endpoints', () => {
  const swaggerApiKey = 'special-key';

  test('uploads an image for an existing pet', async ({ apiClient }) => {
    const pet = createPetDto();

    await apiClient.createPet(pet);
    const response = await apiClient.uploadPetImage(pet.id, 'playwright-upload', 'pet-image.txt');

    expect(response.message).toContain('playwright-upload');
    expect(response.message).toContain('bytes');
  });

  test('adds a new pet to the store', async ({ apiClient }) => {
    const pet = createPetDto();

    const createdPet = await apiClient.createPet(pet);

    expect(createdPet.id).toBe(pet.id);
    expect(createdPet.name).toBe(pet.name);
    expect(createdPet.status).toBe(pet.status);
  });

  test('updates an existing pet', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const updatedPet = await apiClient.updatePet({
      ...pet,
      name: `${pet.name}-updated`,
      status: 'pending',
    });

    expect(updatedPet.name).toBe(`${pet.name}-updated`);
    expect(updatedPet.status).toBe('pending');
  });

  test('finds pets by status', async ({ apiClient }) => {
    const pet = createPetDto();
    pet.status = 'pending';
    await apiClient.createPet(pet);

    const pets = await apiClient.findPetsByStatus('pending');

    expect(Array.isArray(pets)).toBeTruthy();
    expect(pets.some((candidate) => candidate.id === pet.id)).toBeTruthy();
  });

  test('finds pets by tags', async ({ apiClient }) => {
    const pet = createPetDto();
    pet.tags = [{ id: pet.id, name: `tag-${pet.id}` }];
    await apiClient.createPet(pet);

    const pets = await apiClient.findPetsByTags([pet.tags[0].name]);

    expect(pets.some((candidate) => candidate.id === pet.id)).toBeTruthy();
  });

  test('gets a pet by id', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    await expect
      .poll(async () => {
        const response = await apiClient.getPet(pet.id);
        if (!response.ok()) {
          return null;
        }
        const body = await response.json();
        return { id: body.id, name: body.name };
      })
      .toEqual({ id: pet.id, name: pet.name });
  });

  test('gets a pet by id with the documented api key header', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    await expect
      .poll(async () => {
        const response = await apiClient.getPetWithApiKey(pet.id, swaggerApiKey);
        if (!response.ok()) {
          return null;
        }
        const body = await response.json();
        return { id: body.id, name: body.name };
      })
      .toEqual({ id: pet.id, name: pet.name });
  });

  test('updates a pet with form data', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const response = await apiClient.updatePetWithFormData(pet.id, `${pet.name}-form`, 'sold');

    expect(response.message).toContain(String(pet.id));

    await expect
      .poll(async () => {
        const getResponse = await apiClient.getPet(pet.id);
        if (!getResponse.ok()) {
          return null;
        }
        const body = await getResponse.json();
        return { name: body.name, status: body.status };
      })
      .toEqual({ name: `${pet.name}-form`, status: 'sold' });
  });

  test('deletes a pet', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const deleteResponse = await apiClient.deletePet(pet.id);

    expect(deleteResponse.ok()).toBeTruthy();

    const getResponse = await apiClient.getPet(pet.id);
    expect(getResponse.status()).toBe(404);
  });

  test('deletes a pet with the documented api key header', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const deleteResponse = await apiClient.deletePetWithApiKey(pet.id, swaggerApiKey);

    expect(deleteResponse.ok()).toBeTruthy();

    const getResponse = await apiClient.getPet(pet.id);
    expect(getResponse.status()).toBe(404);
  });

  /**
   * Each test below pins a defect documented in `docs/swagger-petstore-bugs.md`.
   * They assert the **current buggy behaviour**, so they pass today and will
   * start failing if the API is ever fixed — at which point the test (and the
   * catalogue) need updating.
   */
  test.describe('Known defects', () => {
    test('AUTH-1: DELETE /pet/{id} succeeds without the documented api_key header', async ({ apiClient, request }) => {
      const pet = createPetDto();
      await apiClient.createPet(pet);

      const response = await request.delete(`pet/${pet.id}`);
      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ code: 200, message: String(pet.id) });
    });

    test('AUTH-1: DELETE /pet/{id} succeeds with a bogus api_key value', async ({ apiClient, request }) => {
      const pet = createPetDto();
      await apiClient.createPet(pet);

      const response = await request.delete(`pet/${pet.id}`, { headers: { api_key: 'literally-anything' } });
      expect(response.status()).toBe(200);
    });

    test('DISCLOSURE-1: GET /pet/{non-numeric-id} 404 body leaks a Java NumberFormatException', async ({ request }) => {
      const response = await request.get('pet/this-is-not-a-number');
      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body.message).toContain('java.lang.NumberFormatException');
      expect(body.message).toContain('this-is-not-a-number');
    });

    test('VAL-1 / DATA-2: POST /pet with empty body returns 200 and id Long.MAX_VALUE', async ({ request }) => {
      const response = await request.post('pet', { data: {} });
      expect(response.status()).toBe(200);
      const body = await response.json();
      // Long.MAX_VALUE = 9223372036854775807, but JSON.parse coerces to a JS number which loses precision.
      // Compare via the raw text to avoid the precision loss.
      const rawText = await request.post('pet', { data: {} }).then((r) => r.text());
      expect(rawText).toContain('9223372036854775807');
      expect(body.photoUrls).toEqual([]);
      expect(body.tags).toEqual([]);
    });

    test('VAL-2: POST /pet with malformed JSON returns 500 "something bad happened"', async ({ request }) => {
      const response = await request.post('pet', {
        headers: { 'content-type': 'application/json' },
        data: 'this is not json' as unknown as object,
      });
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body).toMatchObject({ code: 500, message: 'something bad happened' });
    });

    test('VAL-3: GET /pet/findByStatus?status=banana returns 200 with empty array', async ({ request }) => {
      const response = await request.get('pet/findByStatus?status=banana');
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual([]);
    });

    test('VAL-4: GET /pet/findByStatus with no status param returns 200 (spec says 400)', async ({ request }) => {
      const response = await request.get('pet/findByStatus');
      expect(response.status()).toBe(200);
    });

    test('VAL-5: GET /pet/findByTags with no tags param returns 200 (spec says 400)', async ({ request }) => {
      const response = await request.get('pet/findByTags');
      expect(response.status()).toBe(200);
    });

    test('VAL-9: POST /pet/{id} form-data with empty form is accepted', async ({ apiClient, request }) => {
      const pet = createPetDto();
      await apiClient.createPet(pet);

      const response = await request.post(`pet/${pet.id}`, { form: {} });
      expect(response.status()).toBe(200);
    });

    for (const invalidId of ['0', '-1', 'not-a-number'] as const) {
      test(`CODE-1: GET /pet/${invalidId} returns 404 instead of the documented 400`, async ({ request }) => {
        const response = await request.get(`pet/${invalidId}`);
        expect(response.status()).toBe(404);
      });
    }

    test('SEM-1: PUT /pet silently creates pets with non-existent ids (upsert)', async ({ request }) => {
      const orphanId = 9_876_500_000 + Math.floor(Math.random() * 999_999);
      const orphan = {
        id: orphanId,
        name: `orphan-${orphanId}`,
        photoUrls: ['https://example.com/photo.jpg'],
        status: 'available',
      };
      const putResponse = await request.put('pet', { data: orphan });
      expect(putResponse.status()).toBe(200);

      const getResponse = await request.get(`pet/${orphanId}`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.id).toBe(orphanId);
      expect(body.name).toBe(orphan.name);

      await request.delete(`pet/${orphanId}`);
    });
  });
});
