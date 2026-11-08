import { test, expect } from '@swagger-petstore-fixtures';
import { validateAgainstSchema } from '@helpers/schema-validator';
import petSchema from '@schemas/pet.schema.json';
import orderSchema from '@schemas/order.schema.json';
import inventorySchema from '@schemas/inventory.schema.json';

/**
 * Guards the guards.
 *
 * A schema that silently accepts anything turns every contract check into a
 * no-op that still reports green. These assertions prove the validator and the
 * Pet schema actually bite, so a green API suite means something. They need no
 * network access.
 */
test.describe('Contract validation guard', () => {
  const validPet = { id: 1, name: 'Rex', photoUrls: ['https://example.test/rex.png'], status: 'available' };

  test('accepts a payload that satisfies the contract', () => {
    expect(validateAgainstSchema(petSchema, validPet)).toEqual([]);
  });

  test('rejects wrong types, unknown enum values and missing required fields', () => {
    const wrongType = validateAgainstSchema(petSchema, { ...validPet, id: '1' });
    expect(wrongType.some((error) => error.includes('/id') && error.includes('integer'))).toBe(true);

    const badEnum = validateAgainstSchema(petSchema, { ...validPet, status: 'unknown' });
    expect(badEnum.some((error) => error.includes('/status') && error.includes('allowed values'))).toBe(true);

    const missingField = validateAgainstSchema(petSchema, { name: 'Rex' });
    expect(missingField.some((error) => error.includes("must have required property 'id'"))).toBe(true);
  });

  test('order and inventory schemas reject contract violations', () => {
    const badEnum = validateAgainstSchema(orderSchema, { id: 1, quantity: 2, status: 'shipped' });
    expect(badEnum.some((error) => error.includes('/status') && error.includes('allowed values'))).toBe(true);

    // Inventory keys are free-form (DATA-1), but the counts are integers.
    const badValueType = validateAgainstSchema(inventorySchema, { available: 'many' });
    expect(badValueType.some((error) => error.includes('/available') && error.includes('integer'))).toBe(true);
  });
});
