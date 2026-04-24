import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import type { ApiMessageDto, InventoryDto, UploadImageResponseDto } from '@models/api/common.dto';
import type { PetStatus, TagDto } from '@models/api/pet.dto';

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

export class LocalPetStoreApiClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getHealth(): Promise<{ status: string; service: string }> {
    return this.get<{ status: string; service: string }>('health');
  }

  async getPets(): Promise<LocalPetDto[]> {
    return this.get<LocalPetDto[]>('pets');
  }

  async getPet(id: number): Promise<LocalPetDto> {
    return this.get<LocalPetDto>(`pets/${id}`);
  }

  async findPetsByStatus(status: PetStatus): Promise<LocalPetDto[]> {
    return this.get<LocalPetDto[]>(`pets/findByStatus?status=${status}`);
  }

  async findPetsByTags(tags: string[]): Promise<LocalPetDto[]> {
    return this.get<LocalPetDto[]>(`pets/findByTags?${tags.map((tag) => `tags=${encodeURIComponent(tag)}`).join('&')}`);
  }

  async getPetRelations(id: number): Promise<LocalPetWithRelationsDto> {
    return this.get<LocalPetWithRelationsDto>(`pets/${id}/relations`);
  }

  async createPet(pet: Omit<LocalPetDto, 'createdAt' | 'updatedAt'>): Promise<LocalPetDto> {
    return this.post<Omit<LocalPetDto, 'createdAt' | 'updatedAt'>, LocalPetDto>('pets', pet);
  }

  async updatePet(id: number, pet: Omit<LocalPetDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocalPetDto> {
    return this.put<Omit<LocalPetDto, 'id' | 'createdAt' | 'updatedAt'>, LocalPetDto>(`pets/${id}`, pet);
  }

  async updatePetWithFormData(id: number, name: string, status: PetStatus): Promise<ApiMessageDto> {
    return this.postForm<ApiMessageDto>(`pets/${id}`, {
      name,
      status,
    });
  }

  async uploadPetImage(id: number, additionalMetadata: string, fileName: string): Promise<UploadImageResponseDto> {
    return this.postForm<UploadImageResponseDto>(`pets/${id}/uploadImage`, {
      additionalMetadata,
      file: fileName,
    });
  }

  async deletePet(id: number): Promise<void> {
    await this.delete(`pets/${id}`);
  }

  async getUsers(): Promise<LocalUserDto[]> {
    return this.get<LocalUserDto[]>('users');
  }

  async getEmployees(): Promise<LocalEmployeeDto[]> {
    return this.get<LocalEmployeeDto[]>('employees');
  }

  async getEmployee(id: number): Promise<LocalEmployeeDto> {
    return this.get<LocalEmployeeDto>(`employees/${id}`);
  }

  async createEmployee(employee: Omit<LocalEmployeeDto, 'createdAt'>): Promise<LocalEmployeeDto> {
    return this.post<Omit<LocalEmployeeDto, 'createdAt'>, LocalEmployeeDto>('employees', employee);
  }

  async getCustomers(): Promise<LocalCustomerDto[]> {
    return this.get<LocalCustomerDto[]>('customers');
  }

  async getCustomer(id: number): Promise<LocalCustomerDto> {
    return this.get<LocalCustomerDto>(`customers/${id}`);
  }

  async createCustomer(customer: Omit<LocalCustomerDto, 'createdAt'>): Promise<LocalCustomerDto> {
    return this.post<Omit<LocalCustomerDto, 'createdAt'>, LocalCustomerDto>('customers', customer);
  }

  async getUserByUsername(username: string): Promise<LocalUserDto> {
    return this.get<LocalUserDto>(`users/by-username/${encodeURIComponent(username)}`);
  }

  async getUserRelations(id: number): Promise<LocalUserWithRelationsDto> {
    return this.get<LocalUserWithRelationsDto>(`users/${id}/relations`);
  }

  async createUser(user: Omit<LocalUserDto, 'createdAt'>): Promise<LocalUserDto> {
    return this.post<Omit<LocalUserDto, 'createdAt'>, LocalUserDto>('users', user);
  }

  async createUsersWithArray(users: Array<Omit<LocalUserDto, 'createdAt'>>): Promise<LocalUserDto[]> {
    return this.post<Array<Omit<LocalUserDto, 'createdAt'>>, LocalUserDto[]>('users/createWithArray', users);
  }

  async createUsersWithList(users: Array<Omit<LocalUserDto, 'createdAt'>>): Promise<LocalUserDto[]> {
    return this.post<Array<Omit<LocalUserDto, 'createdAt'>>, LocalUserDto[]>('users/createWithList', users);
  }

  async updateUser(username: string, user: Omit<LocalUserDto, 'createdAt'>): Promise<LocalUserDto> {
    return this.put<Omit<LocalUserDto, 'createdAt'>, LocalUserDto>(`users/${encodeURIComponent(username)}`, user);
  }

  async deleteUser(username: string): Promise<void> {
    await this.delete(`users/${encodeURIComponent(username)}`);
  }

  async loginUser(username: string, password: string): Promise<LocalSessionDto> {
    return this.get<LocalSessionDto>(`users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  }

  async logoutUser(): Promise<ApiMessageDto> {
    return this.get<ApiMessageDto>('users/logout');
  }

  async getOrders(): Promise<LocalOrderDto[]> {
    return this.get<LocalOrderDto[]>('orders');
  }

  async getInventory(): Promise<InventoryDto> {
    return this.get<InventoryDto>('store/inventory');
  }

  async getOrderRelations(id: number): Promise<LocalOrderWithRelationsDto> {
    return this.get<LocalOrderWithRelationsDto>(`orders/${id}/relations`);
  }

  async createOrder(order: Omit<LocalOrderDto, 'createdAt' | 'updatedAt'>): Promise<LocalOrderDto> {
    return this.post<Omit<LocalOrderDto, 'createdAt' | 'updatedAt'>, LocalOrderDto>('orders', order);
  }

  async updateOrderStatus(id: number, status: LocalOrderDto['status']): Promise<LocalOrderDto> {
    return this.request.patch(`orders/${id}/status`, { data: { status } }).then(async (response) => {
      await this.expectOk(response);
      return response.json() as Promise<LocalOrderDto>;
    });
  }

  async getAuditLog(): Promise<AuditLogDto[]> {
    return this.get<AuditLogDto[]>('audit-log');
  }

  async getAuditLogRelations(): Promise<AuditLogWithRelationsDto[]> {
    return this.get<AuditLogWithRelationsDto[]>('audit-log/relations');
  }

  async getEvents(): Promise<LocalAppEventDto[]> {
    return this.get<LocalAppEventDto[]>('events');
  }

  async getReadModels(): Promise<ReadModelSnapshotDto> {
    return this.get<ReadModelSnapshotDto>('read-models');
  }

  async getDownstreamSystems(): Promise<DownstreamSystemSnapshotDto> {
    return this.get<DownstreamSystemSnapshotDto>('downstream-systems');
  }
}
