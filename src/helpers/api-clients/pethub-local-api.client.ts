import type { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import type { ApiMessageDto, InventoryDto, UploadImageResponseDto } from '@models/api/common.dto';
import type { PetStatus } from '@models/api/pet.dto';
import type {
  AuditLogDto,
  AuditLogWithRelationsDto,
  DownstreamSystemSnapshotDto,
  LocalAppEventDto,
  LocalCustomerDto,
  LocalEmployeeDto,
  LocalOrderDto,
  LocalOrderWithRelationsDto,
  LocalPetDto,
  LocalPetWithRelationsDto,
  LocalSessionDto,
  LocalUserDto,
  LocalUserWithRelationsDto,
  ReadModelSnapshotDto,
} from '@models/api/local.dto';

export type {
  AuditLogDto,
  AuditLogWithRelationsDto,
  DownstreamSystemSnapshotDto,
  LocalAppEventDto,
  LocalAppEventType,
  LocalCustomerDto,
  LocalEmployeeDto,
  LocalOrderDto,
  LocalOrderWithRelationsDto,
  LocalPetDto,
  LocalPetWithRelationsDto,
  LocalSessionDto,
  LocalUserDto,
  LocalUserWithRelationsDto,
  ReadModelSnapshotDto,
} from '@models/api/local.dto';

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
