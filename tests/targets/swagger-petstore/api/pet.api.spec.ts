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

    const response = await apiClient.getPet(pet.id);

    expect(response.ok()).toBeTruthy();
    await expect(async () => {
      const body = await response.json();
      expect(body.id).toBe(pet.id);
      expect(body.name).toBe(pet.name);
    }).toPass();
  });

  test('gets a pet by id with the documented api key header', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const response = await apiClient.getPetWithApiKey(pet.id, swaggerApiKey);

    expect(response.ok()).toBeTruthy();
    await expect(async () => {
      const body = await response.json();
      expect(body.id).toBe(pet.id);
      expect(body.name).toBe(pet.name);
    }).toPass();
  });

  test('updates a pet with form data', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);

    const response = await apiClient.updatePetWithFormData(pet.id, `${pet.name}-form`, 'sold');

    expect(response.message).toContain(String(pet.id));

    const getResponse = await apiClient.getPet(pet.id);
    await expect(async () => {
      const body = await getResponse.json();
      expect(body.name).toBe(`${pet.name}-form`);
      expect(body.status).toBe('sold');
    }).toPass();
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
});
