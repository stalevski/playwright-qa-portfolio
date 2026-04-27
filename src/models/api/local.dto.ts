import type { TagDto } from './pet.dto';

export interface LocalPetDto {
  id: number;
  name: string;
  category: string;
  status: 'available' | 'pending' | 'sold';
  price: number;
  notes: string;
  photoUrls?: string[];
  tags?: TagDto[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalUserDto {
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
}

export interface LocalSessionDto {
  id: number;
  username: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface LocalEmployeeDto {
  id: number;
  userId: number;
  employeeCode: string;
  department: string;
  title: string;
  location: string;
  status: 'active' | 'leave' | 'inactive';
  hireDate: string;
  createdAt: string;
}

export interface LocalCustomerDto {
  id: number;
  userId: number;
  customerNumber: string;
  segment: 'retail' | 'vip' | 'breeder' | 'rescue';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'prospect' | 'inactive';
  lifetimeValue: number;
  createdAt: string;
}

export interface LocalOrderDto {
  id: number;
  petId: number;
  userId: number;
  quantity: number;
  status: 'placed' | 'approved' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalOrderWithRelationsDto extends LocalOrderDto {
  pet?: LocalPetDto;
  user?: LocalUserDto;
}

export interface LocalPetWithRelationsDto extends LocalPetDto {
  orders: LocalOrderWithRelationsDto[];
}

export interface LocalUserWithRelationsDto extends LocalUserDto {
  orders: LocalOrderWithRelationsDto[];
}

export interface AuditLogDto {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  details: string;
  createdAt: string;
}

export interface AuditLogWithRelationsDto extends AuditLogDto {
  pet?: LocalPetDto;
  user?: LocalUserDto;
  order?: LocalOrderDto;
}

export type LocalAppEventType =
  | 'pet.created'
  | 'pet.updated'
  | 'pet.deleted'
  | 'user.created'
  | 'user.updated'
  | 'order.created'
  | 'order.status-updated';

export interface LocalAppEventDto {
  id: number;
  type: LocalAppEventType;
  entityType: 'pet' | 'user' | 'order';
  entityId: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ReadModelSnapshotDto {
  petCatalog: Array<{
    id: number;
    name: string;
    category: string;
    status: LocalPetDto['status'];
    price: number;
    updatedAt: string;
  }>;
  userDirectory: Array<{
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  employeeDirectory: Array<{
    id: number;
    userId: number;
    employeeCode: string;
    department: string;
    title: string;
    status: LocalEmployeeDto['status'];
    createdAt: string;
  }>;
  customerRegistry: Array<{
    id: number;
    userId: number;
    customerNumber: string;
    segment: LocalCustomerDto['segment'];
    loyaltyTier: LocalCustomerDto['loyaltyTier'];
    status: LocalCustomerDto['status'];
    lifetimeValue: number;
    createdAt: string;
  }>;
  orderLedger: Array<{
    id: number;
    petId: number;
    userId: number;
    status: LocalOrderDto['status'];
    totalAmount: number;
    updatedAt: string;
  }>;
  auditFeed: AuditLogDto[];
  eventFeed: Array<{
    id: number;
    type: LocalAppEventType;
    entityType: 'pet' | 'user' | 'order';
    entityId: number;
    createdAt: string;
  }>;
}

export interface DownstreamSystemSnapshotDto {
  inventoryReplica: Array<{
    petId: number;
    name: string;
    category: string;
    availabilityStatus: LocalPetDto['status'];
    price: number;
    syncedAt: string;
  }>;
  crmCustomers: Array<{
    userId: number;
    username: string;
    email: string;
    role: string;
    syncedAt: string;
  }>;
  hrEmployees: Array<{
    employeeId: number;
    userId: number;
    employeeCode: string;
    department: string;
    title: string;
    status: LocalEmployeeDto['status'];
    syncedAt: string;
  }>;
  customerProfiles: Array<{
    customerId: number;
    userId: number;
    customerNumber: string;
    segment: LocalCustomerDto['segment'];
    loyaltyTier: LocalCustomerDto['loyaltyTier'];
    lifetimeValue: number;
    status: LocalCustomerDto['status'];
    syncedAt: string;
  }>;
  billingOrders: Array<{
    orderId: number;
    userId: number;
    petId: number;
    amount: number;
    orderStatus: LocalOrderDto['status'];
    syncedAt: string;
  }>;
  analyticsEvents: Array<{
    eventId: number;
    eventType: LocalAppEventType;
    entityType: 'pet' | 'user' | 'order';
    entityId: number;
    createdAt: string;
  }>;
}
