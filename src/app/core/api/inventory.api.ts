import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { InventoryItem, RegisterStockPayload, StockOperationPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private readonly http = inject(HttpClient);

  getStock(productId: string): Promise<InventoryItem> {
    return firstValueFrom(this.http.get<InventoryItem>(`/api/inventory/${productId}`));
  }

  registerStock(payload: RegisterStockPayload): Promise<InventoryItem> {
    return firstValueFrom(this.http.post<InventoryItem>('/api/inventory', payload));
  }

  reserveStock(productId: string, payload: StockOperationPayload): Promise<InventoryItem> {
    return firstValueFrom(
      this.http.post<InventoryItem>(`/api/inventory/${productId}/reserve`, payload),
    );
  }

  releaseStock(productId: string, payload: StockOperationPayload): Promise<void> {
    return firstValueFrom(this.http.post<void>(`/api/inventory/${productId}/release`, payload));
  }
}
