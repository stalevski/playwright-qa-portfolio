export type OrderStatus = 'placed' | 'approved' | 'delivered';

export interface OrderDto {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
  complete: boolean;
}
