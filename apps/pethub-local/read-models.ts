import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type {
  AuditRecord,
  CustomerRecord,
  EmployeeRecord,
  LocalAppEvent,
  OrderRecord,
  PetRecord,
  UserRecord,
} from './database';

export type PetCatalogItem = {
  id: number;
  name: string;
  category: string;
  status: PetRecord['status'];
  price: number;
  updatedAt: string;
};

export type UserDirectoryItem = {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
};

export type OrderLedgerItem = {
  id: number;
  petId: number;
  userId: number;
  status: OrderRecord['status'];
  totalAmount: number;
  updatedAt: string;
};

export type EmployeeDirectoryItem = {
  id: number;
  userId: number;
  employeeCode: string;
  department: string;
  title: string;
  status: EmployeeRecord['status'];
  createdAt: string;
};

export type CustomerRegistryItem = {
  id: number;
  userId: number;
  customerNumber: string;
  segment: CustomerRecord['segment'];
  loyaltyTier: CustomerRecord['loyaltyTier'];
  status: CustomerRecord['status'];
  lifetimeValue: number;
  createdAt: string;
};

export type AuditFeedItem = AuditRecord;

export type EventFeedItem = Pick<LocalAppEvent, 'id' | 'type' | 'entityType' | 'entityId' | 'createdAt'>;

export type ReadModelSnapshot = {
  petCatalog: PetCatalogItem[];
  userDirectory: UserDirectoryItem[];
  employeeDirectory: EmployeeDirectoryItem[];
  customerRegistry: CustomerRegistryItem[];
  orderLedger: OrderLedgerItem[];
  auditFeed: AuditFeedItem[];
  eventFeed: EventFeedItem[];
};

const readModelFile = 'apps/pethub-local/data/read-models-db.json';
const directory = dirname(readModelFile);
if (!existsSync(directory)) {
  mkdirSync(directory, { recursive: true });
}

const adapter = new JSONFile<ReadModelSnapshot>(readModelFile);
const readModelDb = new Low<ReadModelSnapshot>(adapter, {
  petCatalog: [],
  userDirectory: [],
  employeeDirectory: [],
  customerRegistry: [],
  orderLedger: [],
  auditFeed: [],
  eventFeed: [],
});

const ensureLoaded = async (): Promise<void> => {
  await readModelDb.read();
  readModelDb.data ||= {
    petCatalog: [],
    userDirectory: [],
    employeeDirectory: [],
    customerRegistry: [],
    orderLedger: [],
    auditFeed: [],
    eventFeed: [],
  };
};

export const initializeReadModels = async (): Promise<void> => {
  await ensureLoaded();
  await readModelDb.write();
};

export const syncReadModelsFromSource = async (source: {
  pets: PetRecord[];
  users: UserRecord[];
  employees: EmployeeRecord[];
  customers: CustomerRecord[];
  orders: OrderRecord[];
  auditLog: AuditRecord[];
  events: LocalAppEvent[];
}): Promise<void> => {
  await ensureLoaded();
  readModelDb.data = {
    petCatalog: source.pets
      .map((pet) => ({
        id: pet.id,
        name: pet.name,
        category: pet.category,
        status: pet.status,
        price: pet.price,
        updatedAt: pet.updatedAt,
      }))
      .sort((left, right) => right.id - left.id),
    userDirectory: source.users
      .map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }))
      .sort((left, right) => right.id - left.id),
    employeeDirectory: source.employees
      .map((employee) => ({
        id: employee.id,
        userId: employee.userId,
        employeeCode: employee.employeeCode,
        department: employee.department,
        title: employee.title,
        status: employee.status,
        createdAt: employee.createdAt,
      }))
      .sort((left, right) => right.id - left.id),
    customerRegistry: source.customers
      .map((customer) => ({
        id: customer.id,
        userId: customer.userId,
        customerNumber: customer.customerNumber,
        segment: customer.segment,
        loyaltyTier: customer.loyaltyTier,
        status: customer.status,
        lifetimeValue: customer.lifetimeValue,
        createdAt: customer.createdAt,
      }))
      .sort((left, right) => right.id - left.id),
    orderLedger: source.orders
      .map((order) => ({
        id: order.id,
        petId: order.petId,
        userId: order.userId,
        status: order.status,
        totalAmount: order.totalAmount,
        updatedAt: order.updatedAt,
      }))
      .sort((left, right) => right.id - left.id),
    auditFeed: [...source.auditLog].sort((left, right) => right.id - left.id).slice(0, 100),
    eventFeed: source.events
      .map((event) => ({
        id: event.id,
        type: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        createdAt: event.createdAt,
      }))
      .sort((left, right) => right.id - left.id)
      .slice(0, 100),
  };
  await readModelDb.write();
};

export const getReadModelSnapshot = async (): Promise<ReadModelSnapshot> => {
  await ensureLoaded();
  return {
    petCatalog: [...readModelDb.data.petCatalog],
    userDirectory: [...readModelDb.data.userDirectory],
    employeeDirectory: [...readModelDb.data.employeeDirectory],
    customerRegistry: [...readModelDb.data.customerRegistry],
    orderLedger: [...readModelDb.data.orderLedger],
    auditFeed: [...readModelDb.data.auditFeed],
    eventFeed: [...readModelDb.data.eventFeed],
  };
};
