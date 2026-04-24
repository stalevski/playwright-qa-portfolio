import { test, expect } from '@pethub-local-fixtures';
import { RandomDataGenerator } from '@helpers/random-data-generator';

test.describe('Local Petstore API', () => {
  test.describe.configure({ mode: 'serial' });

  test('returns service health', async ({ localApiClient }) => {
    const health = await localApiClient.getHealth();

    expect(health.status).toBe('ok');
    expect(health.service).toBe('pethub-qa-lab');
  });

  test('creates and updates a pet', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Dogs',
      status: 'pending',
    });
    const createdPet = await localApiClient.createPet(pet);

    expect(createdPet.id).toBe(pet.id);
    expect(createdPet.name).toBe(pet.name);

    const updatedPet = await localApiClient.updatePet(pet.id, {
      name: `${pet.name} Updated`,
      category: pet.category,
      status: 'available',
      price: pet.price + 100,
      notes: RandomDataGenerator.randomPetNote(),
    });

    expect(updatedPet.name).toBe(`${pet.name} Updated`);
    expect(updatedPet.status).toBe('available');
  });

  test('supports Swagger-style pet search, form update, upload, and inventory flows', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Cats',
      status: 'available',
    });
    pet.tags = [{ id: pet.id, name: `tag-${pet.id}` }];
    pet.photoUrls = [];

    await localApiClient.createPet(pet);

    const petsByStatus = await localApiClient.findPetsByStatus('available');
    expect(petsByStatus.some((candidate) => candidate.id === pet.id)).toBeTruthy();

    const petsByTags = await localApiClient.findPetsByTags([pet.tags[0].name]);
    expect(petsByTags.some((candidate) => candidate.id === pet.id)).toBeTruthy();

    const formUpdate = await localApiClient.updatePetWithFormData(pet.id, `${pet.name}-form`, 'sold');
    expect(formUpdate.message).toContain(String(pet.id));

    const uploaded = await localApiClient.uploadPetImage(pet.id, 'local-upload', 'pet-image.txt');
    expect(uploaded.message).toContain('local-upload');

    const inventory = await localApiClient.getInventory();
    expect(typeof inventory.available === 'number' || typeof inventory.sold === 'number').toBeTruthy();
  });

  test('supports Swagger-style user lifecycle flows', async ({ localApiClient }) => {
    const user = RandomDataGenerator.createLocalUser({
      role: 'customer',
      password: 'Password123!',
    });

    await localApiClient.createUser(user);

    const foundUser = await localApiClient.getUserByUsername(user.username);
    expect(foundUser.username).toBe(user.username);

    const updatedUser = await localApiClient.updateUser(user.username, {
      ...user,
      firstName: 'Updated',
    });
    expect(updatedUser.firstName).toBe('Updated');

    const loginSession = await localApiClient.loginUser(user.username, user.password ?? 'Password123!');
    expect(loginSession.username).toBe(user.username);

    const bulkUsers = [
      RandomDataGenerator.createLocalUser({ role: 'customer' }),
      RandomDataGenerator.createLocalUser({ role: 'customer' }),
    ];
    const createdArrayUsers = await localApiClient.createUsersWithArray(bulkUsers);
    expect(createdArrayUsers).toHaveLength(2);

    const createdListUsers = await localApiClient.createUsersWithList([
      RandomDataGenerator.createLocalUser({ role: 'customer' }),
    ]);
    expect(createdListUsers).toHaveLength(1);

    const logoutResponse = await localApiClient.logoutUser();
    expect(logoutResponse.message).toBe('ok');

    await localApiClient.deleteUser(user.username);
  });

  test('supports employee and customer business profiles across databases', async ({ localApiClient }) => {
    const employeeUser = RandomDataGenerator.createLocalUser({
      role: 'admin',
      password: 'Password123!',
    });
    const customerUser = RandomDataGenerator.createLocalUser({
      role: 'customer',
      password: 'Password123!',
    });

    await localApiClient.createUser(employeeUser);
    await localApiClient.createUser(customerUser);

    const employee = RandomDataGenerator.createLocalEmployee({
      userId: employeeUser.id,
      status: 'active',
    });
    const customer = RandomDataGenerator.createLocalCustomer({
      userId: customerUser.id,
      status: 'active',
    });

    const createdEmployee = await localApiClient.createEmployee(employee);
    const createdCustomer = await localApiClient.createCustomer(customer);

    expect((await localApiClient.getEmployee(createdEmployee.id)).employeeCode).toBe(employee.employeeCode);
    expect((await localApiClient.getCustomer(createdCustomer.id)).customerNumber).toBe(customer.customerNumber);

    const readModels = await localApiClient.getReadModels();
    expect(readModels.employeeDirectory.some((entry) => entry.id === createdEmployee.id && entry.userId === employeeUser.id)).toBeTruthy();
    expect(readModels.customerRegistry.some((entry) => entry.id === createdCustomer.id && entry.userId === customerUser.id)).toBeTruthy();

    const downstreamSystems = await localApiClient.getDownstreamSystems();
    expect(downstreamSystems.hrEmployees.some((entry) => entry.employeeId === createdEmployee.id && entry.userId === employeeUser.id)).toBeTruthy();
    expect(downstreamSystems.customerProfiles.some((entry) => entry.customerId === createdCustomer.id && entry.userId === customerUser.id)).toBeTruthy();
  });

  test('creates related user and order records and records audit events', async ({ localApiClient }) => {
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
    const createdUser = await localApiClient.createUser(user);

    expect(createdUser.id).toBe(user.id);

    const createdOrder = await localApiClient.createOrder(order);

    expect(createdOrder.id).toBe(order.id);
    expect(createdOrder.petId).toBe(pet.id);

    const updatedOrder = await localApiClient.updateOrderStatus(order.id, 'approved');
    expect(updatedOrder.status).toBe('approved');

    const orderRelations = await localApiClient.getOrderRelations(order.id);
    expect(orderRelations.pet?.id).toBe(pet.id);
    expect(orderRelations.user?.id).toBe(user.id);

    const petRelations = await localApiClient.getPetRelations(pet.id);
    expect(petRelations.orders.some((entry) => entry.id === order.id)).toBeTruthy();

    const userRelations = await localApiClient.getUserRelations(user.id);
    expect(userRelations.orders.some((entry) => entry.id === order.id)).toBeTruthy();

    const auditLog = await localApiClient.getAuditLog();
    expect(auditLog.some((entry) => entry.entityType === 'order' && entry.entityId === order.id)).toBeTruthy();

    const auditLogRelations = await localApiClient.getAuditLogRelations();
    const orderAuditEntry = auditLogRelations.find((entry) => entry.entityType === 'order' && entry.entityId === order.id);
    expect(orderAuditEntry?.order?.id).toBe(order.id);
  });

  test('emits typed domain events for local mutations', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Birds',
      status: 'available',
    });

    await localApiClient.createPet(pet);

    const events = await localApiClient.getEvents();
    const petCreatedEvent = events.find((event) => event.type === 'pet.created' && event.entityId === pet.id);

    expect(petCreatedEvent).toBeDefined();
    expect(petCreatedEvent?.entityType).toBe('pet');
    expect(petCreatedEvent?.payload.petName).toBe(pet.name);
  });

  test('updates read-model and downstream system databases automatically from events', async ({ localApiClient }) => {
    const pet = RandomDataGenerator.createLocalPet({
      category: 'Dogs',
      status: 'available',
    });
    const user = RandomDataGenerator.createLocalUser({
      role: 'customer',
    });

    await localApiClient.createPet(pet);
    await localApiClient.createUser(user);

    const order = RandomDataGenerator.createLocalOrder({
      petId: pet.id,
      userId: user.id,
      status: 'placed',
      totalAmount: pet.price,
    });

    await localApiClient.createOrder(order);

    const readModels = await localApiClient.getReadModels();
    expect(readModels.petCatalog.some((entry) => entry.id === pet.id && entry.name === pet.name)).toBeTruthy();
    expect(readModels.userDirectory.some((entry) => entry.id === user.id && entry.username === user.username)).toBeTruthy();
    expect(readModels.orderLedger.some((entry) => entry.id === order.id && entry.userId === user.id)).toBeTruthy();
    expect(readModels.eventFeed.some((entry) => entry.entityId === order.id && entry.type === 'order.created')).toBeTruthy();

    const downstreamSystems = await localApiClient.getDownstreamSystems();
    expect(downstreamSystems.inventoryReplica.some((entry) => entry.petId === pet.id && entry.name === pet.name)).toBeTruthy();
    expect(downstreamSystems.crmCustomers.some((entry) => entry.userId === user.id && entry.username === user.username)).toBeTruthy();
    expect(downstreamSystems.billingOrders.some((entry) => entry.orderId === order.id && entry.amount === pet.price)).toBeTruthy();
    expect(downstreamSystems.analyticsEvents.some((entry) => entry.entityId === order.id && entry.eventType === 'order.created')).toBeTruthy();
  });
});
