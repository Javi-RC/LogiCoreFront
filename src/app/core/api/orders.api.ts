import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateOrderPayload, Order } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  getOrders(customerId?: string): Promise<Order[]> {
    const params = customerId ? { customerId } : undefined;
    return firstValueFrom(this.http.get<Order[]>('/api/orders', { params }));
  }

  getOrder(id: string): Promise<Order> {
    return firstValueFrom(this.http.get<Order>(`/api/orders/${id}`));
  }

  createOrder(payload: CreateOrderPayload): Promise<Order> {
    return firstValueFrom(this.http.post<Order>('/api/orders', payload));
  }

  cancelOrder(id: string): Promise<Order> {
    return firstValueFrom(this.http.post<Order>(`/api/orders/${id}/cancel`, null));
  }
}
