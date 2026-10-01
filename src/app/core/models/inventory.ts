export interface InventoryItem {
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface RegisterStockPayload {
  productId: string;
  quantity: number;
}

export interface StockOperationPayload {
  correlationId: string;
  quantity: number;
}
