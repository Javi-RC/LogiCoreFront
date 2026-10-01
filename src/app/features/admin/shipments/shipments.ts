import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Order, Shipment } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime, shortId } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-shipments',
  imports: [FormsModule, StatusBadge],
  templateUrl: './shipments.html',
  styleUrl: './shipments.css',
})
export class Shipments implements OnInit {
  private readonly shipmentsApi = inject(ShipmentsApi);
  private readonly ordersApi = inject(OrdersApi);
  private readonly toast = inject(ToastService);

  protected readonly shipments = signal<Shipment[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly creating = signal(false);

  protected createOrderId = '';

  protected readonly availableOrders = computed(() =>
    this.orders().filter((o) => o.status === 'CONFIRMED'),
  );

  protected readonly formatDateTime = formatDateTime;
  protected readonly shortId = shortId;

  async ngOnInit(): Promise<void> {
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected itemsLabel(shipment: Shipment): string {
    const order = this.orders().find((o) => o.id === shipment.orderId);
    return order ? `${order.items.reduce((n, i) => n + i.quantity, 0)} artículos` : '—';
  }

  private async load(): Promise<void> {
    const [s, o] = await Promise.all([
      this.shipmentsApi.getShipments(),
      this.ordersApi.getOrders(),
    ]);
    this.shipments.set(s);
    this.orders.set(o);
  }

  private async withBusy(id: string | null, fn: () => Promise<unknown>): Promise<void> {
    this.error.set('');
    this.busyId.set(id);
    try {
      await fn();
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busyId.set(null);
    }
  }

  protected ship(shipment: Shipment): void {
    void this.withBusy(shipment.shipmentId, async () => {
      await this.shipmentsApi.shipShipment(shipment.shipmentId);
      this.toast.success(`Envío ${shortId(shipment.shipmentId)} despachado`);
    });
  }

  protected deliver(shipment: Shipment): void {
    void this.withBusy(shipment.shipmentId, async () => {
      await this.shipmentsApi.deliverShipment(shipment.shipmentId);
      this.toast.success(`Envío ${shortId(shipment.shipmentId)} entregado`);
    });
  }

  protected async createForOrder(): Promise<void> {
    if (!this.createOrderId) return;
    const order = this.orders().find((o) => o.id === this.createOrderId);
    if (!order) return;
    this.creating.set(true);
    this.error.set('');
    try {
      await this.shipmentsApi.createShipment({ orderId: order.id, customerId: order.customerId });
      this.toast.success('Envío creado');
      this.showForm.set(false);
      this.createOrderId = '';
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.creating.set(false);
    }
  }
}
