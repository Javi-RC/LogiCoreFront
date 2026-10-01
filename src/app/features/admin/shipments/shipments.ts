import { Component, OnInit, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Order, Shipment, ShipmentStatus } from '../../../core/models';
import { ProductNamesService } from '../../../core/services/product-names.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime, formatMoney, shortId } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';
import { FieldError } from '../../../shared/ui/form/field-error';
import { ValidatedSubmit } from '../../../shared/ui/form/validated-submit';

const STATUSES: ShipmentStatus[] = ['CREATED', 'SHIPPED', 'DELIVERED'];

@Component({
  selector: 'app-shipments',
  imports: [FormsModule, RouterLink, StatusBadge, CopyId, FieldError, ValidatedSubmit],
  templateUrl: './shipments.html',
  styleUrl: './shipments.css',
})
export class Shipments implements OnInit {
  private readonly shipmentsApi = inject(ShipmentsApi);
  private readonly ordersApi = inject(OrdersApi);
  private readonly toast = inject(ToastService);
  protected readonly productNames = inject(ProductNamesService);

  protected readonly shipments = signal<Shipment[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly creating = signal(false);

  // Query params (?estado=CREATED, ?crear=1): los usa el dashboard para enlazar aquí.
  readonly estado = input<string>();
  readonly crear = input<string>();

  protected readonly showForm = linkedSignal(() => this.crear() === '1');
  protected readonly statusFilter = linkedSignal<ShipmentStatus | 'ALL'>(() => {
    const estado = this.estado() as ShipmentStatus;
    return STATUSES.includes(estado) ? estado : 'ALL';
  });

  protected createOrderId = '';

  protected readonly availableOrders = computed(() => {
    const withShipment = new Set(this.shipments().map((s) => s.orderId));
    return this.orders().filter((o) => o.status === 'CONFIRMED' && !withShipment.has(o.id));
  });

  protected readonly statusOptions = computed(() => {
    const shipments = this.shipments();
    const count = (status: ShipmentStatus) => shipments.filter((s) => s.status === status).length;
    return [
      { value: 'ALL' as const, label: 'Todos', count: shipments.length },
      { value: 'CREATED' as const, label: 'Por despachar', count: count('CREATED') },
      { value: 'SHIPPED' as const, label: 'En camino', count: count('SHIPPED') },
      { value: 'DELIVERED' as const, label: 'Entregados', count: count('DELIVERED') },
    ];
  });

  protected readonly visibleShipments = computed(() => {
    const status = this.statusFilter();
    const shipments = this.shipments();
    return status === 'ALL' ? shipments : shipments.filter((s) => s.status === status);
  });

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;
  protected readonly shortId = shortId;

  async ngOnInit(): Promise<void> {
    void this.productNames.load();
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected contentOf(shipment: Shipment): string {
    const order = this.orders().find((o) => o.id === shipment.orderId);
    return order ? this.productNames.summarize(order.items) : 'Pedido no disponible';
  }

  private async load(): Promise<void> {
    const [s, o] = await Promise.all([
      this.shipmentsApi.getShipments(),
      this.ordersApi.getOrders(),
    ]);
    this.shipments.set(s.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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
