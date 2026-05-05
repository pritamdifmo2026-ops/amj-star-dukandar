// Order feature types

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Order {
  id: string;
  buyerId: string;
  supplierId: string;
  items: OrderItem[];
  totalAmount: number;
  gstAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  deliveryAddress: string;
}
