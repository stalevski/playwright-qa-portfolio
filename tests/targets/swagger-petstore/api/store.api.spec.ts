import { test, expect } from '@swagger-petstore-fixtures';
import { createOrderDto, createPetDto } from '@helpers/test-data';

test.describe('Petstore API - Store endpoints', () => {
  const swaggerApiKey = 'special-key';

  test('returns pet inventories by status', async ({ apiClient }) => {
    const inventory = await apiClient.getInventory();

    expect(typeof inventory).toBe('object');
    expect(Object.keys(inventory).length).toBeGreaterThan(0);
  });

  test('returns pet inventories when using the documented api key header', async ({ apiClient }) => {
    const inventory = await apiClient.getInventoryWithApiKey(swaggerApiKey);

    expect(typeof inventory).toBe('object');
    expect(Object.keys(inventory).length).toBeGreaterThan(0);
  });

  test('places an order for a pet', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);
    const order = createOrderDto();
    order.petId = pet.id;

    const createdOrder = await apiClient.placeOrder(order);

    expect(createdOrder.id).toBe(order.id);
    expect(createdOrder.petId).toBe(pet.id);
  });

  test('finds purchase order by id', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);
    const order = createOrderDto();
    order.petId = pet.id;
    await apiClient.placeOrder(order);

    const foundOrder = await apiClient.getOrder(order.id);

    expect(foundOrder.id).toBe(order.id);
    expect(foundOrder.petId).toBe(pet.id);
  });

  test('deletes purchase order by id', async ({ apiClient }) => {
    const pet = createPetDto();
    await apiClient.createPet(pet);
    const order = createOrderDto();
    order.petId = pet.id;
    await apiClient.placeOrder(order);

    const deleteResponse = await apiClient.deleteOrder(order.id);

    expect(deleteResponse.ok()).toBeTruthy();
  });
});
