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

  /**
   * Each test below pins a defect documented in `docs/swagger-petstore-bugs.md`.
   * They assert the **current buggy behaviour**, so they pass today and will
   * start failing if the API is ever fixed.
   */
  test.describe('Known defects', () => {
    test('DATA-1: GET /store/inventory contains keys outside the documented enum', async ({ request }) => {
      const response = await request.get('store/inventory');
      expect(response.status()).toBe(200);
      const inventoryText = await response.text();
      const documentedEnum = ['available', 'pending', 'sold'];
      const keys = [...inventoryText.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]);
      const garbageKeys = keys.filter((k) => !documentedEnum.includes(k));
      // The shared sandbox is full of user-submitted garbage values
      // (e.g. `SOLD`, `avalible`, `False`, `0`, `Busy`, `string`, ...).
      // We only assert that *at least one* key outside the documented enum exists,
      // because the exact contents fluctuate as other users hit the sandbox.
      expect(garbageKeys.length).toBeGreaterThan(0);
    });

    test('DATA-1: GET /store/inventory commonly contains case-only duplicate keys (sold + SOLD)', async ({
      request,
    }) => {
      const response = await request.get('store/inventory');
      const text = await response.text();
      const keys = [...text.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]);
      const lowered = keys.map((k) => k.toLowerCase());
      const hasCaseDuplicate = lowered.some((k, i) => lowered.indexOf(k) !== i);
      // Tolerant assertion: the duplicate may not always be present depending on what
      // the sandbox currently holds, but the *capacity* for case-only duplicates is the
      // defect — flag if not currently observed so the catalogue can be re-checked.
      expect.soft(hasCaseDuplicate).toBeTruthy();
    });

    test('VAL-6: POST /store/order accepts an empty body', async ({ request }) => {
      const response = await request.post('store/order', { data: {} });
      expect(response.status()).toBe(200);
    });

    test('VAL-6: POST /store/order accepts an invalid status value', async ({ request, apiClient }) => {
      const pet = createPetDto();
      await apiClient.createPet(pet);
      const order = createOrderDto();
      order.petId = pet.id;
      const response = await request.post('store/order', { data: { ...order, status: 'banana' } });
      expect(response.status()).toBe(200);
    });

    test('VAL-6: POST /store/order accepts ids outside the documented 1..10 range', async ({ request, apiClient }) => {
      const pet = createPetDto();
      await apiClient.createPet(pet);
      const order = createOrderDto();
      order.petId = pet.id;
      order.id = 9_876_500_000 + Math.floor(Math.random() * 999_999);

      const postResponse = await request.post('store/order', { data: order });
      expect(postResponse.status()).toBe(200);

      const getResponse = await request.get(`store/order/${order.id}`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.id).toBe(order.id);
    });

    for (const invalidId of ['-1', 'abc'] as const) {
      test(`CODE-2: GET /store/order/${invalidId} returns 404 instead of the documented 400`, async ({ request }) => {
        const response = await request.get(`store/order/${invalidId}`);
        expect(response.status()).toBe(404);
      });
    }

    test('CODE-3: DELETE /store/order/abc returns 404 instead of the documented 400', async ({ request }) => {
      const response = await request.delete('store/order/abc');
      expect(response.status()).toBe(404);
    });
  });
});
