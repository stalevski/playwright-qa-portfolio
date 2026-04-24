import { test, expect } from '@pethub-local-fixtures';
import { RandomDataGenerator } from '@helpers/random-data-generator';
import { JsonSqlDatabase } from '@helpers/sql/json-sql-database';

type CountRow = {
  total: number;
};

type PetRow = {
  id: number;
  name: string;
  status: string;
  price: number;
};

type OrderRelationRow = {
  orderId: number;
  petName: string;
  status: string;
};

type OrderUserRow = {
  id: number;
  username: string;
};

type ReadModelPetRow = {
  id: number;
  name: string;
  status: string;
};

const operationalDb = new JsonSqlDatabase('apps/pethub-local/data/petstore-db.json');
const readModelsDb = new JsonSqlDatabase('apps/pethub-local/data/read-models-db.json');
const nextUniqueId = (): number => Date.now() + Math.floor(Math.random() * 100000);

test.describe('Local Petstore database validation with SQL', () => {
  test.describe.configure({ mode: 'serial' });

  test('validates a created pet persisted in the operational database', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      id: nextUniqueId(),
      category: 'Dogs',
      status: 'pending',
    });

    await localApiClient.createPet(pet);

    await expect.poll(async () => {
      const [countRow] = await operationalDb.query<CountRow>('SELECT COUNT(*) AS total FROM pets WHERE id = ?', [pet.id]);
      return countRow.total;
    }).toBe(1);

    const [persistedPet] = await operationalDb.query<PetRow>('SELECT id, name, status, price FROM pets WHERE id = ?', [pet.id]);

    expect(persistedPet.id).toBe(pet.id);
    expect(persistedPet.name).toBe(pet.name);
    expect(persistedPet.status).toBe(pet.status);
    expect(persistedPet.price).toBe(pet.price);
  });

  test('validates order relationships using SQL joins against the operational database', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      id: nextUniqueId(),
      category: 'Cats',
      status: 'available',
    });
    const user = RandomDataGenerator.createLocalUser({
      id: nextUniqueId(),
      role: 'customer',
    });
    const order = RandomDataGenerator.createLocalOrder({
      id: nextUniqueId(),
      petId: pet.id,
      userId: user.id,
      status: 'placed',
      totalAmount: pet.price,
    });

    await localApiClient.createPet(pet);
    await localApiClient.createUser(user);
    await localApiClient.createOrder(order);

    await expect.poll(async () => {
      const [countRow] = await operationalDb.query<CountRow>('SELECT COUNT(*) AS total FROM orders WHERE id = ?', [order.id]);
      return countRow.total;
    }).toBe(1);

    await expect.poll(async () => {
      const [relationRow] = await operationalDb.query<OrderRelationRow>(
        'SELECT orders.id AS orderId, pets.name AS petName, orders.status AS status FROM orders INNER JOIN pets ON orders.petId = pets.id WHERE orders.id = ?',
        [order.id],
      );
      return relationRow?.petName ?? null;
    }).toBe(pet.name);

    await expect.poll(async () => {
      const [userRow] = await operationalDb.query<OrderUserRow>('SELECT id, username FROM users WHERE id = ?', [user.id]);
      return userRow?.username ?? null;
    }).toBe(user.username);

    const [relationRow] = await operationalDb.query<OrderRelationRow>(
      'SELECT orders.id AS orderId, pets.name AS petName, orders.status AS status FROM orders INNER JOIN pets ON orders.petId = pets.id WHERE orders.id = ?',
      [order.id],
    );
    const [userRow] = await operationalDb.query<OrderUserRow>('SELECT id, username FROM users WHERE id = ?', [user.id]);

    expect(relationRow.orderId).toBe(order.id);
    expect(relationRow.petName).toBe(pet.name);
    expect(relationRow.status).toBe('placed');
    expect(userRow.id).toBe(user.id);
    expect(userRow.username).toBe(user.username);
  });

  test('validates read-model projections with SQL queries after local mutations', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      id: nextUniqueId(),
      category: 'Birds',
      status: 'available',
    });

    await localApiClient.createPet(pet);
    await localApiClient.updatePet(pet.id, {
      name: `${pet.name} Updated`,
      category: pet.category,
      status: 'sold',
      price: pet.price + 50,
      notes: pet.notes,
    });

    await expect.poll(async () => {
      const [projectionCount] = await readModelsDb.query<CountRow>('SELECT COUNT(*) AS total FROM petCatalog WHERE id = ?', [pet.id]);
      return projectionCount.total;
    }).toBe(1);

    const [projectedPet] = await readModelsDb.query<ReadModelPetRow>('SELECT id, name, status FROM petCatalog WHERE id = ?', [pet.id]);

    expect(projectedPet.id).toBe(pet.id);
    expect(projectedPet.name).toBe(`${pet.name} Updated`);
    expect(projectedPet.status).toBe('sold');
  });
});
