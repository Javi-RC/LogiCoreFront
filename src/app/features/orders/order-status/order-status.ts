import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucidePackageCheck, LucideSparkles } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { NotificationsApi } from '../../../core/api/notifications.api';
import { OrdersApi } from '../../../core/api/orders.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Notification, Order, Shipment } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { formatDateTime, formatMoney, shortId } from '../../../core/util/format';
import { summarizeItems } from '../../../core/util/order-summary';
import { OrderTimeline } from '../../../shared/order-timeline/order-timeline';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';

const POLL_INTERVAL_MS = 3000;

const notifMeta: Record<string, { label: string; tone: string }> = {
  ORDER_CREATED: { label: 'Creado', tone: 'info' },
  ORDER_CONFIRMED: { label: 'Confirmado', tone: 'success' },
  ORDER_CANCELLED: { label: 'Cancelado', tone: 'danger' },
  ORDER_FAILED: { label: 'Fallido', tone: 'danger' },
  SHIPMENT_CREATED: { label: 'Envío generado', tone: 'warning' },
  SHIPMENT_SHIPPED: { label: 'Despachado', tone: 'violet' },
};

@Component({
  selector: 'app-order-status',
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucidePackageCheck,
    LucideSparkles,
    StatusBadge,
    OrderTimeline,
    CopyId,
  ],
  templateUrl: './order-status.html',
  styleUrl: './order-status.css',
})
export class OrderStatus {
  private readonly ordersApi = inject(OrdersApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly shipmentsApi = inject(ShipmentsApi);
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly confirmService = inject(ConfirmService);

  // Parámetro de ruta :id (withComponentInputBinding)
  readonly id = input.required<string>();
  // Datos de ruta: el panel admin reutiliza esta pantalla con su propio enlace de vuelta.
  readonly backTo = input<string>();
  readonly backLabel = input<string>();

  protected readonly order = signal<Order | null>(null);
  protected readonly shipment = signal<Shipment | null>(null);
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly canceling = signal(false);

  protected readonly delivered = computed(
    () => this.order()?.status === 'CONFIRMED' && this.shipment()?.status === 'DELIVERED',
  );
  protected readonly terminal = computed(
    () => this.order()?.status === 'CANCELLED' || this.order()?.status === 'FAILED',
  );

  protected readonly cancellable = computed(() => {
    const status = this.order()?.status;
    return (status === 'PENDING' || status === 'CONFIRMED') && !this.delivered();
  });

  protected readonly productNames = signal<Record<string, string>>({});
  protected readonly title = computed(() =>
    summarizeItems(this.order()?.items ?? [], this.productNames()),
  );

  protected readonly confettiDots = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;
  protected readonly shortId = shortId;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  // Identifica la carga en curso; descarta respuestas de un pedido anterior.
  private run = 0;

  constructor() {
    // Los nombres son un extra: si falla, se muestra el ID corto del producto.
    this.productsApi
      .getProducts()
      .then((products) =>
        this.productNames.set(Object.fromEntries(products.map((p) => [p.id, p.name]))),
      )
      .catch(() => undefined);

    // Recarga y reinicia el polling cada vez que cambia el pedido de la ruta.
    effect((onCleanup) => {
      const orderId = this.id();
      untracked(() => void this.start(orderId));
      onCleanup(() => {
        this.run++;
        this.stopPolling();
      });
    });
  }

  protected notifLabel(type: string): string {
    return notifMeta[type]?.label ?? type;
  }

  protected notifTone(type: string): string {
    return notifMeta[type]?.tone ?? 'info';
  }

  private async start(orderId: string): Promise<void> {
    const run = ++this.run;
    this.order.set(null);
    this.shipment.set(null);
    this.notifications.set([]);
    this.error.set('');
    this.loading.set(true);

    await this.load(orderId, run);
    if (run === this.run && !this.error()) this.startPolling(orderId, run);
  }

  private async load(orderId: string, run: number): Promise<void> {
    try {
      const order = await this.ordersApi.getOrder(orderId);
      const notifications = await this.notificationsApi.getNotificationsByCorrelation(orderId);
      let shipment: Shipment | null;
      try {
        shipment = await this.shipmentsApi.getShipmentByOrder(orderId);
      } catch {
        shipment = null;
      }
      if (run !== this.run) return;
      this.order.set(order);
      this.notifications.set(notifications);
      this.shipment.set(shipment);
    } catch (err) {
      if (run === this.run) this.error.set(extractError(err));
    } finally {
      if (run === this.run) this.loading.set(false);
    }
  }

  private isTerminal(): boolean {
    return this.terminal() || this.delivered();
  }

  private startPolling(orderId: string, run: number): void {
    if (!this.order() || this.isTerminal()) return;

    this.pollTimer = setInterval(async () => {
      try {
        const order = await this.ordersApi.getOrder(orderId);
        if (run !== this.run) return;
        this.order.set(order);
        if (!this.terminal()) {
          try {
            const shipment = await this.shipmentsApi.getShipmentByOrder(orderId);
            if (run !== this.run) return;
            this.shipment.set(shipment);
          } catch {
            /* not yet */
          }
        }
        const notifications = await this.notificationsApi.getNotificationsByCorrelation(orderId);
        if (run !== this.run) return;
        this.notifications.set(notifications);
      } catch {
        /* keep state */
      }
      if (run === this.run && this.isTerminal()) this.stopPolling();
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  protected async cancel(): Promise<void> {
    const order = this.order();
    if (!order) return;
    const ok = await this.confirmService.confirm({
      title: 'Cancelar pedido',
      message: `¿Seguro que quieres cancelar el pedido ${shortId(order.id)}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, cancelar',
      danger: true,
    });
    if (!ok) return;
    const run = this.run;
    this.canceling.set(true);
    try {
      const cancelled = await this.ordersApi.cancelOrder(order.id);
      const notifications = await this.notificationsApi.getNotificationsByCorrelation(order.id);
      if (run !== this.run) return;
      this.order.set(cancelled);
      this.notifications.set(notifications);
    } catch (err) {
      if (run === this.run) this.error.set(extractError(err));
    } finally {
      this.canceling.set(false);
    }
  }
}
