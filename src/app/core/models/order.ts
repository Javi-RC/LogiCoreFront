export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerId: string;
  items: CreateOrderItem[];
}
