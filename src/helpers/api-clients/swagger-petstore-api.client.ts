import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from '@core/api/base-api.client';
import { validateAgainstSchema } from '@helpers/schema-validator';
import type { ApiMessageDto, InventoryDto, UploadImageResponseDto } from '@models/api/common.dto';
import type { OrderDto } from '@models/api/order.dto';
import type { PetDto, PetStatus } from '@models/api/pet.dto';
import type { UserDto } from '@models/api/user.dto';
import petSchema from '@schemas/pet.schema.json';
import apiMessageSchema from '@schemas/api-message.schema.json';
import orderSchema from '@schemas/order.schema.json';
import userSchema from '@schemas/user.schema.json';
import inventorySchema from '@schemas/inventory.schema.json';

// The status/tag searches return the same Pet shape as an array.
const petsSchema = { type: 'array', items: petSchema };

export class PetStoreApiClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async uploadPetImage(petId: number, additionalMetadata: string, fileName: string): Promise<UploadImageResponseDto> {
    return this.postMultipart<UploadImageResponseDto>(
      `pet/${petId}/uploadImage`,
      {
        additionalMetadata,
        file: fileName,
      },
      apiMessageSchema,
    );
  }

  async createPet(pet: PetDto): Promise<PetDto> {
    return this.post<PetDto, PetDto>('pet', pet, petSchema);
  }

  async updatePet(pet: PetDto): Promise<PetDto> {
    return this.put<PetDto, PetDto>('pet', pet, petSchema);
  }

  async getPet(petId: number): Promise<APIResponse> {
    return this.request.get(`pet/${petId}`);
  }

  async getPetWithApiKey(petId: number, apiKey: string): Promise<APIResponse> {
    return this.request.get(`pet/${petId}`, {
      headers: {
        api_key: apiKey,
      },
    });
  }

  async findPetsByTags(tags: string[]): Promise<PetDto[]> {
    return this.get<PetDto[]>(
      `pet/findByTags?${tags.map((tag) => `tags=${encodeURIComponent(tag)}`).join('&')}`,
      petsSchema,
    );
  }

  async updatePetWithFormData(petId: number, name: string, status: PetStatus): Promise<ApiMessageDto> {
    return this.postForm<ApiMessageDto>(
      `pet/${petId}`,
      {
        name,
        status,
      },
      apiMessageSchema,
    );
  }

  async deletePet(petId: number): Promise<APIResponse> {
    return this.delete(`pet/${petId}`);
  }

  async deletePetWithApiKey(petId: number, apiKey: string): Promise<APIResponse> {
    const response = await this.request.delete(`pet/${petId}`, {
      headers: {
        api_key: apiKey,
      },
    });

    await this.expectOk(response);
    return response;
  }

  async findPetsByStatus(status: PetStatus): Promise<PetDto[]> {
    return this.get<PetDto[]>(`pet/findByStatus?status=${status}`, petsSchema);
  }

  async getInventory(): Promise<InventoryDto> {
    return this.get<InventoryDto>('store/inventory', inventorySchema);
  }

  async getInventoryWithApiKey(apiKey: string): Promise<InventoryDto> {
    const response = await this.request.get('store/inventory', {
      headers: {
        api_key: apiKey,
      },
    });

    await this.expectOk(response);
    const body = (await response.json()) as InventoryDto;
    // This path bypasses the typed helpers, so validate explicitly.
    const errors = validateAgainstSchema(inventorySchema, body);
    if (errors.length > 0) {
      throw new Error(`store/inventory does not satisfy its JSON Schema: ${errors.join('; ')}`);
    }
    return body;
  }

  async placeOrder(order: OrderDto): Promise<OrderDto> {
    return this.post<OrderDto, OrderDto>('store/order', order, orderSchema);
  }

  async getOrder(orderId: number): Promise<OrderDto> {
    return this.get<OrderDto>(`store/order/${orderId}`, orderSchema);
  }

  async deleteOrder(orderId: number): Promise<APIResponse> {
    return this.delete(`store/order/${orderId}`);
  }

  async createUsersWithArray(users: UserDto[]): Promise<ApiMessageDto> {
    return this.post<UserDto[], ApiMessageDto>('user/createWithArray', users, apiMessageSchema);
  }

  async createUsersWithList(users: UserDto[]): Promise<ApiMessageDto> {
    return this.post<UserDto[], ApiMessageDto>('user/createWithList', users, apiMessageSchema);
  }

  async getUser(username: string): Promise<UserDto> {
    return this.get<UserDto>(`user/${encodeURIComponent(username)}`, userSchema);
  }

  async updateUser(username: string, user: UserDto): Promise<ApiMessageDto> {
    return this.put<UserDto, ApiMessageDto>(`user/${encodeURIComponent(username)}`, user, apiMessageSchema);
  }

  async deleteUser(username: string): Promise<APIResponse> {
    return this.delete(`user/${encodeURIComponent(username)}`);
  }

  async loginUser(username: string, password: string): Promise<ApiMessageDto> {
    return this.get<ApiMessageDto>(
      `user/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      apiMessageSchema,
    );
  }

  async createUser(user: UserDto): Promise<ApiMessageDto> {
    return this.post<UserDto, ApiMessageDto>('user', user, apiMessageSchema);
  }

  async logoutUser(): Promise<ApiMessageDto> {
    return this.get<ApiMessageDto>('user/logout', apiMessageSchema);
  }
}
