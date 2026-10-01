import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateShipmentPayload, Shipment } from '../models';

@Injectable({ providedIn: 'root' })
export class ShipmentsApi {
  private readonly http = inject(HttpClient);

  getShipments(): Promise<Shipment[]> {
    return firstValueFrom(this.http.get<Shipment[]>('/api/shipments'));
  }

  getShipment(id: string): Promise<Shipment> {
    return firstValueFrom(this.http.get<Shipment>(`/api/shipments/${id}`));
  }

  getShipmentByOrder(orderId: string): Promise<Shipment> {
    return firstValueFrom(this.http.get<Shipment>(`/api/shipments/order/${orderId}`));
  }

  createShipment(payload: CreateShipmentPayload): Promise<Shipment> {
    return firstValueFrom(this.http.post<Shipment>('/api/shipments', payload));
  }

  shipShipment(id: string): Promise<Shipment> {
    return firstValueFrom(this.http.post<Shipment>(`/api/shipments/${id}/ship`, null));
  }

  deliverShipment(id: string): Promise<Shipment> {
    return firstValueFrom(this.http.post<Shipment>(`/api/shipments/${id}/deliver`, null));
  }
}
