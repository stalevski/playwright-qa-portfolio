import { OrderBuilder } from '@builders/order.builder';
import { PetBuilder } from '@builders/pet.builder';
import { UserBuilder } from '@builders/user.builder';
import type { OrderDto } from '@models/api/order.dto';
import type { PetDto } from '@models/api/pet.dto';
import type { UserDto } from '@models/api/user.dto';

export const createPetDto = (): PetDto => new PetBuilder().build();

export const createOrderDto = (): OrderDto => new OrderBuilder().build();

export const createUserDto = (): UserDto => new UserBuilder().build();
