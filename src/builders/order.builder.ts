import type { OrderDto, OrderStatus } from '@models/api/order.dto';
import { uniqueId } from '@helpers/unique-id';

export class OrderBuilder {
  private order: OrderDto;

  constructor() {
    const id = uniqueId();
    this.order = {
      id,
      petId: id,
      quantity: 1,
      shipDate: new Date().toISOString(),
      status: 'placed',
      complete: false,
    };
  }

  withId(id: number): OrderBuilder {
    this.order.id = id;
    return this;
  }

  withPetId(petId: number): OrderBuilder {
    this.order.petId = petId;
    return this;
  }

  withQuantity(quantity: number): OrderBuilder {
    this.order.quantity = quantity;
    return this;
  }

  withShipDate(shipDate: string): OrderBuilder {
    this.order.shipDate = shipDate;
    return this;
  }

  withStatus(status: OrderStatus): OrderBuilder {
    this.order.status = status;
    return this;
  }

  withComplete(complete: boolean): OrderBuilder {
    this.order.complete = complete;
    return this;
  }

  build(): OrderDto {
    return { ...this.order };
  }
}
