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
  orderId: number;
  username: string;
  status: string;
};

type ReadModelPetRow = {
  id: number;
  name: string;
  status: string;
};

const operationalDb = new JsonSqlDatabase('apps/pethub-local/data/petstore-db.json');
const readModelsDb = new JsonSqlDatabase('apps/pethub-local/data/read-models-db.json');

test.describe('Local Petstore database validation with SQL', () => {
  test.describe.configure({ mode: 'serial' });

  test('validates a created pet persisted in the operational database', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Dogs',
      status: 'pending',
    });

    await localApiClient.createPet(pet);

    const [countRow] = await operationalDb.query<CountRow>('SELECT COUNT(*) AS total FROM pets WHERE id = ?', [pet.id]);
    const [persistedPet] = await operationalDb.query<PetRow>('SELECT id, name, status, price FROM pets WHERE id = ?', [pet.id]);

    expect(countRow.total).toBe(1);
    expect(persistedPet.id).toBe(pet.id);
    expect(persistedPet.name).toBe(pet.name);
    expect(persistedPet.status).toBe(pet.status);
    expect(persistedPet.price).toBe(pet.price);
  });

  test('validates order relationships using SQL joins against the operational database', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Cats',
      status: 'available',
    });
    const user = RandomDataGenerator.createLocalUser({
      role: 'customer',
    });
    const order = RandomDataGenerator.createLocalOrder({
      petId: pet.id,
      userId: user.id,
      status: 'placed',
      totalAmount: pet.price,
    });

    await localApiClient.createPet(pet);
    await localApiClient.createUser(user);
    await localApiClient.createOrder(order);

    const [relationRow] = await operationalDb.query<OrderRelationRow>(
      'SELECT orders.id AS orderId, pets.name AS petName, orders.status AS status FROM orders INNER JOIN pets ON orders.petId = pets.id WHERE orders.id = ?',
      [order.id],
    );
    const [userJoinRow] = await operationalDb.query<OrderUserRow>(
      'SELECT orders.id AS orderId, users.username AS username, orders.status AS status FROM orders INNER JOIN users ON orders.userId = users.id WHERE orders.id = ?',
      [order.id],
    );

    expect(relationRow.orderId).toBe(order.id);
    expect(relationRow.petName).toBe(pet.name);
    expect(relationRow.status).toBe('placed');
    expect(userJoinRow.username).toBe(user.username);
  });

  test('validates read-model projections with SQL queries after local mutations', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
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

    const [projectionCount] = await readModelsDb.query<CountRow>('SELECT COUNT(*) AS total FROM petCatalog WHERE id = ?', [pet.id]);
    const [projectedPet] = await readModelsDb.query<ReadModelPetRow>('SELECT id, name, status FROM petCatalog WHERE id = ?', [pet.id]);

    expect(projectionCount.total).toBe(1);
    expect(projectedPet.id).toBe(pet.id);
    expect(projectedPet.name).toBe(`${pet.name} Updated`);
    expect(projectedPet.status).toBe('sold');
  });
});
