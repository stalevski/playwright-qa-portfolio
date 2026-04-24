import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { initializeDownstreamSystems, syncDownstreamSystemsFromSource } from './downstream-systems';
import { initializeReadModels, syncReadModelsFromSource } from './read-models';

export type PetRecord = {
  id: number;
  name: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
  price: number;
  notes: string;
  photoUrls?: string[];
  tags?: Array<{ id: number; name: string }>;
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password?: string;
  phone?: string;
  userStatus?: number;
  createdAt: string;
};

export type SessionRecord = {
  id: number;
  username: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export type EmployeeRecord = {
  id: number;
  userId: number;
  employeeCode: string;
  department: string;
  title: string;
  location: string;
  status: 'active' | 'leave' | 'inactive';
  hireDate: string;
  createdAt: string;
};

export type CustomerRecord = {
  id: number;
  userId: number;
  customerNumber: string;
  segment: 'retail' | 'vip' | 'breeder' | 'rescue';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'prospect' | 'inactive';
  lifetimeValue: number;
  createdAt: string;
};

export type OrderRecord = {
  id: number;
  petId: number;
  userId: number;
  quantity: number;
  status: 'placed' | 'approved' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type AuditRecord = {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  details: string;
  createdAt: string;
};

export type LocalAppEventType =
  | 'pet.created'
  | 'pet.updated'
  | 'pet.deleted'
  | 'user.created'
  | 'order.created'
  | 'order.status-updated';

export type LocalAppEvent = {
  id: number;
  type: LocalAppEventType;
  entityType: 'pet' | 'user' | 'order';
  entityId: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type OrderWithRelations = OrderRecord & {
  pet?: PetRecord;
  user?: UserRecord;
};

export type PetWithRelations = PetRecord & {
  orders: OrderWithRelations[];
};

export type UserWithRelations = UserRecord & {
  orders: OrderWithRelations[];
};

export type AuditRecordWithRelations = AuditRecord & {
  pet?: PetRecord;
  user?: UserRecord;
  order?: OrderRecord;
};

type DatabaseSchema = {
  pets: PetRecord[];
  users: UserRecord[];
  employees: EmployeeRecord[];
  customers: CustomerRecord[];
  orders: OrderRecord[];
  auditLog: AuditRecord[];
  events: LocalAppEvent[];
  sessions: SessionRecord[];
};

const databaseFile = 'apps/pethub-local/data/petstore-db.json';
const directory = dirname(databaseFile);
if (!existsSync(directory)) {
  mkdirSync(directory, { recursive: true });
}

const adapter = new JSONFile<DatabaseSchema>(databaseFile);
const database = new Low<DatabaseSchema>(adapter, {
  pets: [],
  users: [],
  employees: [],
  customers: [],
  orders: [],
  auditLog: [],
  events: [],
  sessions: [],
});

const now = () => new Date().toISOString();

const ensureLoaded = async (): Promise<void> => {
  await database.read();
  database.data ||= { pets: [], users: [], employees: [], customers: [], orders: [], auditLog: [], events: [], sessions: [] };
  database.data.events ||= [];
  database.data.sessions ||= [];
  database.data.employees ||= [];
  database.data.customers ||= [];
};

export const initializeDatabase = async (): Promise<void> => {
  await ensureLoaded();

  if (database.data.pets.length === 0) {
    const timestamp = now();
    database.data.pets.push(
      { id: 1001, name: 'Golden Retriever', category: 'Dogs', status: 'available', price: 1200, notes: 'Friendly and family trained', createdAt: timestamp, updatedAt: timestamp },
      { id: 1002, name: 'British Shorthair', category: 'Cats', status: 'pending', price: 900, notes: 'Indoor cat with vaccination record', tags: [{ id: 1, name: 'indoor' }], photoUrls: [], createdAt: timestamp, updatedAt: timestamp },
      { id: 1003, name: 'Cockatiel', category: 'Birds', status: 'sold', price: 300, notes: 'Comes with cage and starter kit', tags: [{ id: 2, name: 'starter-kit' }], photoUrls: [], createdAt: timestamp, updatedAt: timestamp },
    );
  }

  if (database.data.users.length === 0) {
    const timestamp = now();
    database.data.users.push(
      { id: 2001, username: 'admin', firstName: 'Store', lastName: 'Admin', email: 'admin@localpetstore.test', role: 'admin', password: 'Password123!', phone: '1002003000', userStatus: 1, createdAt: timestamp },
      { id: 2002, username: 'buyer01', firstName: 'Pet', lastName: 'Buyer', email: 'buyer01@localpetstore.test', role: 'customer', password: 'Password123!', phone: '1234567890', userStatus: 1, createdAt: timestamp },
    );
  }

  if (database.data.employees.length === 0) {
    const timestamp = now();
    database.data.employees.push({
      id: 4001,
      userId: 2001,
      employeeCode: 'EMP-4001',
      department: 'Operations',
      title: 'Store Administrator',
      location: 'HQ',
      status: 'active',
      hireDate: timestamp,
      createdAt: timestamp,
    });
  }

  if (database.data.customers.length === 0) {
    const timestamp = now();
    database.data.customers.push({
      id: 5001,
      userId: 2002,
      customerNumber: 'CUST-5001',
      segment: 'retail',
      loyaltyTier: 'silver',
      status: 'active',
      lifetimeValue: 900,
      createdAt: timestamp,
    });
  }

  if (database.data.orders.length === 0) {
    const timestamp = now();
    database.data.orders.push({ id: 3001, petId: 1002, userId: 2002, quantity: 1, status: 'placed', totalAmount: 900, createdAt: timestamp, updatedAt: timestamp });
  }

  await initializeReadModels();
  await initializeDownstreamSystems();
  await syncDerivedStores();
  await database.write();
};

export const getPets = async (): Promise<PetRecord[]> => {
  await ensureLoaded();
  return [...database.data.pets].sort((left, right) => right.id - left.id);
};

export const getPetById = async (id: number): Promise<PetRecord | undefined> => {
  await ensureLoaded();
  return database.data.pets.find((pet: PetRecord) => pet.id === id);
};

export const findPetsByStatus = async (status: PetRecord['status']): Promise<PetRecord[]> => {
  await ensureLoaded();
  return database.data.pets.filter((pet: PetRecord) => pet.status === status).sort((left, right) => right.id - left.id);
};

export const findPetsByTags = async (tags: string[]): Promise<PetRecord[]> => {
  await ensureLoaded();
  return database.data.pets
    .filter((pet: PetRecord) => (pet.tags ?? []).some((tag) => tags.includes(tag.name)))
    .sort((left, right) => right.id - left.id);
};

export const createPet = async (pet: Omit<PetRecord, 'createdAt' | 'updatedAt'>): Promise<PetRecord> => {
  await ensureLoaded();
  const timestamp = now();
  const createdPet: PetRecord = { ...pet, createdAt: timestamp, updatedAt: timestamp };
  database.data.pets.unshift(createdPet);
  emitEvent('pet.created', 'pet', pet.id, {
    petName: pet.name,
    category: pet.category,
    status: pet.status,
  });
  await syncDerivedStores();
  await database.write();
  return createdPet;
};

export const updatePet = async (id: number, pet: Omit<PetRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PetRecord | undefined> => {
  await ensureLoaded();
  const index = database.data.pets.findIndex((candidate: PetRecord) => candidate.id === id);
  if (index === -1) {
    return undefined;
  }

  const updatedPet: PetRecord = {
    ...database.data.pets[index],
    ...pet,
    updatedAt: now(),
  };
  database.data.pets[index] = updatedPet;
  emitEvent('pet.updated', 'pet', id, {
    petName: updatedPet.name,
    status: updatedPet.status,
  });
  await syncDerivedStores();
  await database.write();
  return updatedPet;
};

export const updatePetWithFormData = async (id: number, form: { name?: string; status?: PetRecord['status'] }): Promise<PetRecord | undefined> => {
  await ensureLoaded();
  const existingPet = await getPetById(id);
  if (!existingPet) {
    return undefined;
  }

  return updatePet(id, {
    name: form.name ?? existingPet.name,
    category: existingPet.category,
    status: form.status ?? existingPet.status,
    price: existingPet.price,
    notes: existingPet.notes,
    photoUrls: existingPet.photoUrls ?? [],
    tags: existingPet.tags ?? [],
  });
};

export const deletePet = async (id: number): Promise<boolean> => {
  await ensureLoaded();
  const originalLength = database.data.pets.length;
  database.data.pets = database.data.pets.filter((pet: PetRecord) => pet.id !== id);
  const deleted = database.data.pets.length < originalLength;
  if (deleted) {
    emitEvent('pet.deleted', 'pet', id, {
      petId: id,
    });
    await syncDerivedStores();
    await database.write();
  }
  return deleted;
};

export const getUsers = async (): Promise<UserRecord[]> => {
  await ensureLoaded();
  return [...database.data.users].sort((left, right) => right.id - left.id);
};

export const getEmployees = async (): Promise<EmployeeRecord[]> => {
  await ensureLoaded();
  return [...database.data.employees].sort((left, right) => right.id - left.id);
};

export const getEmployeeById = async (id: number): Promise<EmployeeRecord | undefined> => {
  await ensureLoaded();
  return database.data.employees.find((employee: EmployeeRecord) => employee.id === id);
};

export const createEmployee = async (employee: Omit<EmployeeRecord, 'createdAt'>): Promise<EmployeeRecord> => {
  await ensureLoaded();
  const createdEmployee: EmployeeRecord = { ...employee, createdAt: now() };
  database.data.employees.unshift(createdEmployee);
  await syncDerivedStores();
  await database.write();
  return createdEmployee;
};

export const getCustomers = async (): Promise<CustomerRecord[]> => {
  await ensureLoaded();
  return [...database.data.customers].sort((left, right) => right.id - left.id);
};

export const getCustomerById = async (id: number): Promise<CustomerRecord | undefined> => {
  await ensureLoaded();
  return database.data.customers.find((customer: CustomerRecord) => customer.id === id);
};

export const createCustomer = async (customer: Omit<CustomerRecord, 'createdAt'>): Promise<CustomerRecord> => {
  await ensureLoaded();
  const createdCustomer: CustomerRecord = { ...customer, createdAt: now() };
  database.data.customers.unshift(createdCustomer);
  await syncDerivedStores();
  await database.write();
  return createdCustomer;
};

export const getUserById = async (id: number): Promise<UserRecord | undefined> => {
  await ensureLoaded();
  return database.data.users.find((user: UserRecord) => user.id === id);
};

export const getUserByUsername = async (username: string): Promise<UserRecord | undefined> => {
  await ensureLoaded();
  return database.data.users.find((user: UserRecord) => user.username === username);
};

export const createUser = async (user: Omit<UserRecord, 'createdAt'>): Promise<UserRecord> => {
  await ensureLoaded();
  const createdUser: UserRecord = { ...user, createdAt: now() };
  database.data.users.unshift(createdUser);
  emitEvent('user.created', 'user', user.id, {
    username: user.username,
    role: user.role,
  });
  await syncDerivedStores();
  await database.write();
  return createdUser;
};

export const createUsers = async (users: Array<Omit<UserRecord, 'createdAt'>>): Promise<UserRecord[]> => {
  const createdUsers: UserRecord[] = [];
  for (const user of users) {
    createdUsers.push(await createUser(user));
  }
  return createdUsers;
};

export const updateUser = async (username: string, user: Omit<UserRecord, 'createdAt'>): Promise<UserRecord | undefined> => {
  await ensureLoaded();
  const index = database.data.users.findIndex((candidate: UserRecord) => candidate.username === username);
  if (index === -1) {
    return undefined;
  }

  const updatedUser: UserRecord = {
    ...database.data.users[index],
    ...user,
  };
  database.data.users[index] = updatedUser;
  emitEvent('user.created', 'user', updatedUser.id, {
    username: updatedUser.username,
    role: updatedUser.role,
  });
  await syncDerivedStores();
  await database.write();
  return updatedUser;
};

export const deleteUser = async (username: string): Promise<boolean> => {
  await ensureLoaded();
  const originalLength = database.data.users.length;
  database.data.users = database.data.users.filter((user: UserRecord) => user.username !== username);
  const deleted = database.data.users.length < originalLength;
  if (deleted) {
    database.data.sessions = database.data.sessions.filter((session: SessionRecord) => session.username !== username);
    await syncDerivedStores();
    await database.write();
  }
  return deleted;
};

export const getOrders = async (): Promise<OrderRecord[]> => {
  await ensureLoaded();
  return [...database.data.orders].sort((left, right) => right.id - left.id);
};

export const getInventory = async (): Promise<Record<string, number>> => {
  await ensureLoaded();
  return database.data.pets.reduce<Record<string, number>>((inventory, pet) => {
    inventory[pet.status] = (inventory[pet.status] ?? 0) + 1;
    return inventory;
  }, {});
};

export const getOrdersWithRelations = async (): Promise<OrderWithRelations[]> => {
  await ensureLoaded();
  return [...database.data.orders]
    .sort((left, right) => right.id - left.id)
    .map((order: OrderRecord) => ({
      ...order,
      pet: database.data.pets.find((pet: PetRecord) => pet.id === order.petId),
      user: database.data.users.find((user: UserRecord) => user.id === order.userId),
    }));
};

export const getOrderById = async (id: number): Promise<OrderRecord | undefined> => {
  await ensureLoaded();
  return database.data.orders.find((order: OrderRecord) => order.id === id);
};

export const getOrderByIdWithRelations = async (id: number): Promise<OrderWithRelations | undefined> => {
  await ensureLoaded();
  const order = database.data.orders.find((candidate: OrderRecord) => candidate.id === id);
  if (!order) {
    return undefined;
  }

  return {
    ...order,
    pet: database.data.pets.find((pet: PetRecord) => pet.id === order.petId),
    user: database.data.users.find((user: UserRecord) => user.id === order.userId),
  };
};

export const createOrder = async (order: Omit<OrderRecord, 'createdAt' | 'updatedAt'>): Promise<OrderRecord> => {
  await ensureLoaded();
  const timestamp = now();
  const createdOrder: OrderRecord = { ...order, createdAt: timestamp, updatedAt: timestamp };
  database.data.orders.unshift(createdOrder);
  emitEvent('order.created', 'order', order.id, {
    petId: order.petId,
    userId: order.userId,
    status: order.status,
  });
  await syncDerivedStores();
  await database.write();
  return createdOrder;
};

export const updateOrderStatus = async (id: number, status: OrderRecord['status']): Promise<OrderRecord | undefined> => {
  await ensureLoaded();
  const index = database.data.orders.findIndex((candidate: OrderRecord) => candidate.id === id);
  if (index === -1) {
    return undefined;
  }

  const updatedOrder: OrderRecord = {
    ...database.data.orders[index],
    status,
    updatedAt: now(),
  };
  database.data.orders[index] = updatedOrder;
  emitEvent('order.status-updated', 'order', id, {
    status,
  });
  await syncDerivedStores();
  await database.write();
  return updatedOrder;
};

export const getEvents = async (): Promise<LocalAppEvent[]> => {
  await ensureLoaded();
  return [...database.data.events].sort((left, right) => right.id - left.id).slice(0, 100);
};

export const loginUser = async (username: string, password: string): Promise<SessionRecord | undefined> => {
  await ensureLoaded();
  const user = database.data.users.find((candidate: UserRecord) => candidate.username === username && candidate.password === password);
  if (!user) {
    return undefined;
  }

  const createdAt = now();
  const session: SessionRecord = {
    id: (database.data.sessions[0]?.id ?? 0) + 1,
    username,
    token: `session-${Date.now()}`,
    createdAt,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  database.data.sessions.unshift(session);
  await database.write();
  return session;
};

export const logoutUser = async (): Promise<void> => {
  await ensureLoaded();
  database.data.sessions = [];
  await database.write();
};

export const getAuditLog = async (): Promise<AuditRecord[]> => {
  await ensureLoaded();
  return [...database.data.auditLog].sort((left, right) => right.id - left.id).slice(0, 100);
};

export const getAuditLogWithRelations = async (): Promise<AuditRecordWithRelations[]> => {
  await ensureLoaded();
  return [...database.data.auditLog]
    .sort((left, right) => right.id - left.id)
    .slice(0, 100)
    .map((entry: AuditRecord) => ({
      ...entry,
      pet: entry.entityType === 'pet' ? database.data.pets.find((pet: PetRecord) => pet.id === entry.entityId) : undefined,
      user: entry.entityType === 'user' ? database.data.users.find((user: UserRecord) => user.id === entry.entityId) : undefined,
      order: entry.entityType === 'order' ? database.data.orders.find((order: OrderRecord) => order.id === entry.entityId) : undefined,
    }));
};

export const getPetByIdWithRelations = async (id: number): Promise<PetWithRelations | undefined> => {
  await ensureLoaded();
  const pet = database.data.pets.find((candidate: PetRecord) => candidate.id === id);
  if (!pet) {
    return undefined;
  }

  const orders = database.data.orders
    .filter((order: OrderRecord) => order.petId === id)
    .sort((left, right) => right.id - left.id)
    .map((order: OrderRecord) => ({
      ...order,
      pet,
      user: database.data.users.find((user: UserRecord) => user.id === order.userId),
    }));

  return {
    ...pet,
    orders,
  };
};

export const getUserByIdWithRelations = async (id: number): Promise<UserWithRelations | undefined> => {
  await ensureLoaded();
  const user = database.data.users.find((candidate: UserRecord) => candidate.id === id);
  if (!user) {
    return undefined;
  }

  const orders = database.data.orders
    .filter((order: OrderRecord) => order.userId === id)
    .sort((left, right) => right.id - left.id)
    .map((order: OrderRecord) => ({
      ...order,
      pet: database.data.pets.find((pet: PetRecord) => pet.id === order.petId),
      user,
    }));

  return {
    ...user,
    orders,
  };
};

const addAudit = (entityType: string, entityId: number, action: string, details: string): void => {
  const nextId = (database.data?.auditLog[0]?.id ?? 0) + 1;
  database.data?.auditLog.unshift({
    id: nextId,
    entityType,
    entityId,
    action,
    details,
    createdAt: now(),
  });
};

const emitEvent = (type: LocalAppEventType, entityType: 'pet' | 'user' | 'order', entityId: number, payload: Record<string, unknown>): void => {
  const nextId = (database.data?.events[0]?.id ?? 0) + 1;
  const createdAt = now();

  database.data?.events.unshift({
    id: nextId,
    type,
    entityType,
    entityId,
    payload,
    createdAt,
  });

  const auditEntry = toAuditRecord(type, entityType, entityId, payload, createdAt);
  addAudit(auditEntry.entityType, auditEntry.entityId, auditEntry.action, auditEntry.details);
};

const syncDerivedStores = async (): Promise<void> => {
  if (!database.data) {
    return;
  }

  await syncReadModelsFromSource({
    pets: database.data.pets,
    users: database.data.users,
    employees: database.data.employees,
    customers: database.data.customers,
    orders: database.data.orders,
    auditLog: database.data.auditLog,
    events: database.data.events,
  });

  await syncDownstreamSystemsFromSource({
    pets: database.data.pets,
    users: database.data.users,
    employees: database.data.employees,
    customers: database.data.customers,
    orders: database.data.orders,
    events: database.data.events,
  });
};

const toAuditRecord = (type: LocalAppEventType, entityType: 'pet' | 'user' | 'order', entityId: number, payload: Record<string, unknown>, createdAt: string): AuditRecord => {
  const nextId = (database.data?.auditLog[0]?.id ?? 0) + 1;

  switch (type) {
    case 'pet.created':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'created',
        details: `Pet ${String(payload.petName ?? entityId)} created`,
        createdAt,
      };
    case 'pet.updated':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'updated',
        details: `Pet ${entityId} updated`,
        createdAt,
      };
    case 'pet.deleted':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'deleted',
        details: `Pet ${entityId} deleted`,
        createdAt,
      };
    case 'user.created':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'created',
        details: `User ${String(payload.username ?? entityId)} created`,
        createdAt,
      };
    case 'order.created':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'created',
        details: `Order ${entityId} created`,
        createdAt,
      };
    case 'order.status-updated':
      return {
        id: nextId,
        entityType,
        entityId,
        action: 'status-updated',
        details: `Order ${entityId} changed to ${String(payload.status ?? 'unknown')}`,
        createdAt,
      };
  }
};
