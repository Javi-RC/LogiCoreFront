export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_FAILED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_SHIPPED';

export interface Notification {
  id: string;
  type: NotificationType;
  correlationId: string;
  recipient: string;
  message: string;
  createdAt: string;
}
