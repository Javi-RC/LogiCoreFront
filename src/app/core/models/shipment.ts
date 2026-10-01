export type ShipmentStatus = 'CREATED' | 'SHIPPED' | 'DELIVERED';

export interface Shipment {
  shipmentId: string;
  orderId: string;
  customerId: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentPayload {
  orderId: string;
  customerId: string;
}
