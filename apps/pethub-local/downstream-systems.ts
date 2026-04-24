import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import type { CustomerRecord, EmployeeRecord, LocalAppEvent, OrderRecord, PetRecord, UserRecord } from './database';

export type InventoryReplicaRecord = {
  petId: number;
  name: string;
  category: string;
  availabilityStatus: PetRecord['status'];
  price: number;
  syncedAt: string;
};

export type CrmCustomerRecord = {
  userId: number;
  username: string;
  email: string;
  role: string;
  syncedAt: string;
};

export type BillingOrderRecord = {
  orderId: number;
  userId: number;
  petId: number;
  amount: number;
  orderStatus: OrderRecord['status'];
  syncedAt: string;
};

export type AnalyticsEventRecord = {
  eventId: number;
  eventType: LocalAppEvent['type'];
  entityType: LocalAppEvent['entityType'];
  entityId: number;
  createdAt: string;
};

export type HrEmployeeRecord = {
  employeeId: number;
  userId: number;
  employeeCode: string;
  department: string;
  title: string;
  status: EmployeeRecord['status'];
  syncedAt: string;
};

export type CustomerProfileRecord = {
  customerId: number;
  userId: number;
  customerNumber: string;
  segment: CustomerRecord['segment'];
  loyaltyTier: CustomerRecord['loyaltyTier'];
  lifetimeValue: number;
  status: CustomerRecord['status'];
  syncedAt: string;
};

export type DownstreamSystemSnapshot = {
  inventoryReplica: InventoryReplicaRecord[];
  crmCustomers: CrmCustomerRecord[];
  hrEmployees: HrEmployeeRecord[];
  customerProfiles: CustomerProfileRecord[];
  billingOrders: BillingOrderRecord[];
  analyticsEvents: AnalyticsEventRecord[];
};

const downstreamFile = 'apps/pethub-local/data/downstream-systems-db.json';
const directory = dirname(downstreamFile);
if (!existsSync(directory)) {
  mkdirSync(directory, { recursive: true });
}

const adapter = new JSONFile<DownstreamSystemSnapshot>(downstreamFile);
const downstreamDb = new Low<DownstreamSystemSnapshot>(adapter, {
  inventoryReplica: [],
  crmCustomers: [],
  hrEmployees: [],
  customerProfiles: [],
  billingOrders: [],
  analyticsEvents: [],
});

const ensureLoaded = async (): Promise<void> => {
  await downstreamDb.read();
  downstreamDb.data ||= {
    inventoryReplica: [],
    crmCustomers: [],
    hrEmployees: [],
    customerProfiles: [],
    billingOrders: [],
    analyticsEvents: [],
  };
};

export const initializeDownstreamSystems = async (): Promise<void> => {
  await ensureLoaded();
  await downstreamDb.write();
};

export const syncDownstreamSystemsFromSource = async (source: {
  pets: PetRecord[];
  users: UserRecord[];
  employees: EmployeeRecord[];
  customers: CustomerRecord[];
  orders: OrderRecord[];
  events: LocalAppEvent[];
}): Promise<void> => {
  await ensureLoaded();
  downstreamDb.data = {
    inventoryReplica: source.pets
      .map((pet) => ({
        petId: pet.id,
        name: pet.name,
        category: pet.category,
        availabilityStatus: pet.status,
        price: pet.price,
        syncedAt: pet.updatedAt,
      }))
      .sort((left, right) => right.petId - left.petId),
    crmCustomers: source.users
      .map((user) => ({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        syncedAt: user.createdAt,
      }))
      .sort((left, right) => right.userId - left.userId),
    hrEmployees: source.employees
      .map((employee) => ({
        employeeId: employee.id,
        userId: employee.userId,
        employeeCode: employee.employeeCode,
        department: employee.department,
        title: employee.title,
        status: employee.status,
        syncedAt: employee.createdAt,
      }))
      .sort((left, right) => right.employeeId - left.employeeId),
    customerProfiles: source.customers
      .map((customer) => ({
        customerId: customer.id,
        userId: customer.userId,
        customerNumber: customer.customerNumber,
        segment: customer.segment,
        loyaltyTier: customer.loyaltyTier,
        lifetimeValue: customer.lifetimeValue,
        status: customer.status,
        syncedAt: customer.createdAt,
      }))
      .sort((left, right) => right.customerId - left.customerId),
    billingOrders: source.orders
      .map((order) => ({
        orderId: order.id,
        userId: order.userId,
        petId: order.petId,
        amount: order.totalAmount,
        orderStatus: order.status,
        syncedAt: order.updatedAt,
      }))
      .sort((left, right) => right.orderId - left.orderId),
    analyticsEvents: source.events
      .map((event) => ({
        eventId: event.id,
        eventType: event.type,
        entityType: event.entityType,
        entityId: event.entityId,
        createdAt: event.createdAt,
      }))
      .sort((left, right) => right.eventId - left.eventId)
      .slice(0, 100),
  };
  await downstreamDb.write();
};

export const getDownstreamSystemSnapshot = async (): Promise<DownstreamSystemSnapshot> => {
  await ensureLoaded();
  return {
    inventoryReplica: [...downstreamDb.data.inventoryReplica],
    crmCustomers: [...downstreamDb.data.crmCustomers],
    hrEmployees: [...downstreamDb.data.hrEmployees],
    customerProfiles: [...downstreamDb.data.customerProfiles],
    billingOrders: [...downstreamDb.data.billingOrders],
    analyticsEvents: [...downstreamDb.data.analyticsEvents],
  };
};
