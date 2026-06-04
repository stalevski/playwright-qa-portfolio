import { OrderBuilder } from '@builders/order.builder';
import { PetBuilder } from '@builders/pet.builder';
import { UserBuilder } from '@builders/user.builder';
import type { OrderDto } from '@models/api/order.dto';
import type { PetDto } from '@models/api/pet.dto';
import type { UserDto } from '@models/api/user.dto';

export const sauceDemoUsers = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  problem: 'problem_user',
  performanceGlitch: 'performance_glitch_user',
  error: 'error_user',
  visual: 'visual_user',
} as const;

export const sauceDemoPassword = 'secret_sauce';

/**
 * Storefront personas for the in-repo `pethub-local` app. These mirror the
 * accounts defined in `apps/pethub-local/storefront/storefront.ts` (the app is
 * the runtime source of truth that validates logins); this constant is the
 * single place tests and tooling reference them, so update both if they change.
 */
export const pethubLocalUsers = {
  standard: 'standard_user',
  problem: 'problem_user',
  performance: 'performance_user',
  lockedOut: 'locked_out_user',
} as const;

export const pethubLocalPassword = 'pethub123';

export const sauceDemoProducts = {
  backpack: 'Sauce Labs Backpack',
  bikeLight: 'Sauce Labs Bike Light',
  boltTShirt: 'Sauce Labs Bolt T-Shirt',
  fleeceJacket: 'Sauce Labs Fleece Jacket',
  onesie: 'Sauce Labs Onesie',
  testAllTheThings: 'Test.allTheThings() T-Shirt (Red)',
} as const;

/** Inventory item id used in `/inventory-item.html?id=N` for `standard_user`. */
export const sauceDemoProductIds: Record<string, number> = {
  [sauceDemoProducts.bikeLight]: 0,
  [sauceDemoProducts.boltTShirt]: 1,
  [sauceDemoProducts.onesie]: 2,
  [sauceDemoProducts.testAllTheThings]: 3,
  [sauceDemoProducts.backpack]: 4,
  [sauceDemoProducts.fleeceJacket]: 5,
};

export const createPetDto = (): PetDto => new PetBuilder().build();

export const createOrderDto = (): OrderDto => new OrderBuilder().build();

export const createUserDto = (): UserDto => new UserBuilder().build();
