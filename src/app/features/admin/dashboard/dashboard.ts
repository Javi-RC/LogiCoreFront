import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideActivity,
  LucideArrowRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucidePackage,
  LucideRefreshCw,
  LucideShoppingCart,
} from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { NotificationsApi } from '../../../core/api/notifications.api';
import { OrdersApi } from '../../../core/api/orders.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Notification, Order, Product, Shipment } from '../../../core/models';
import { ProductNamesService } from '../../../core/services/product-names.service';
import { formatDateTime, formatMoney, formatTime } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';

const REFRESH_INTERVAL_MS = 20000;

interface Todo {
  key: string;
  count: number;
  title: string;
  hint: string;
  cta: string;
  to: string;
  query: Record<string, string>;
}

interface PipelineStage {
  key: string;
  label: string;
  desc: string;
  count: number;
  share: number;
  to: string;
  query: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    LucideActivity,
    LucideArrowRight,
    LucideCircleAlert,
    LucideCircleCheck,
    LucidePackage,
    LucideRefreshCw,
    LucideShoppingCart,
    StatusBadge,
    CopyId,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly productsApi = inject(ProductsApi);
  private readonly ordersApi = inject(OrdersApi);
  private readonly shipmentsApi = inject(ShipmentsApi);
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly productNames = inject(ProductNamesService);

  protected readonly products = signal<Product[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly shipments = signal<Shipment[]>([]);
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly updatedAt = signal<Date | null>(null);
  protected readonly error = signal('');

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;
  protected readonly formatTime = formatTime;

  protected readonly stats = computed(() => ({
    products: this.products().length,
    activeProducts: this.products().filter((p) => p.active).length,
  }));

  protected readonly hovered = signal<string | null>(null);

  protected readonly deliveredShipments = computed(
    () => this.shipments().filter((s) => s.status === 'DELIVERED').length,
  );

  // Cada pedido cae en una sola etapa, así que las etapas suman el total del flujo.
  protected readonly pipeline = computed(() => {
    const shipmentStatus = new Map(this.shipments().map((s) => [s.orderId, s.status]));
    let pending = 0;
    let toDispatch = 0;
    let inTransit = 0;
    let delivered = 0;
    let failed = 0;
    for (const order of this.orders()) {
      if (order.status === 'PENDING') pending++;
      else if (order.status !== 'CONFIRMED') failed++;
      else if (shipmentStatus.get(order.id) === 'DELIVERED') delivered++;
      else if (shipmentStatus.get(order.id) === 'SHIPPED') inTransit++;
      else toDispatch++;
    }
    const active = pending + toDispatch + inTransit + delivered;
    const stage = (
      key: string,
      label: string,
      desc: string,
      count: number,
      to: string,
      estado: string,
    ): PipelineStage => ({
      key,
      label,
      desc,
      count,
      share: active ? Math.round((count / active) * 100) : 0,
      to,
      query: { estado },
    });

    return {
      total: this.orders().length,
      active,
      failed,
      stages: [
        stage(
          'pending',
          'Pendientes',
          'esperando confirmación',
          pending,
          '/admin/orders',
          'PENDING',
        ),
        stage(
          'to-dispatch',
          'Por despachar',
          'stock reservado',
          toDispatch,
          '/admin/shipments',
          'CREATED',
        ),
        stage(
          'in-transit',
          'En camino',
          'envío despachado',
          inTransit,
          '/admin/shipments',
          'SHIPPED',
        ),
        stage(
          'delivered',
          'Entregados',
          'recorrido completo',
          delivered,
          '/admin/shipments',
          'DELIVERED',
        ),
      ],
    };
  });

  protected readonly pipelineSummary = computed(
    () =>
      'Reparto de pedidos por etapa: ' +
      this.pipeline()
        .stages.map((s) => `${s.label} ${s.count}`)
        .join(', '),
  );

  protected readonly todos = computed<Todo[]>(() => {
    const shipments = this.shipments();
    const withShipment = new Set(shipments.map((s) => s.orderId));
    const awaitingShipment = this.orders().filter(
      (o) => o.status === 'CONFIRMED' && !withShipment.has(o.id),
    ).length;
    const toDispatch = shipments.filter((s) => s.status === 'CREATED').length;
    const toDeliver = shipments.filter((s) => s.status === 'SHIPPED').length;

    const todos: Todo[] = [
      {
        key: 'awaiting-shipment',
        count: awaitingShipment,
        title:
          awaitingShipment === 1 ? 'Pedido confirmado sin envío' : 'Pedidos confirmados sin envío',
        hint: 'El stock ya está reservado',
        cta: 'Crear envío',
        to: '/admin/shipments',
        query: { crear: '1' },
      },
      {
        key: 'to-dispatch',
        count: toDispatch,
        title: toDispatch === 1 ? 'Envío por despachar' : 'Envíos por despachar',
        hint: 'Creados y listos para salir',
        cta: 'Despachar',
        to: '/admin/shipments',
        query: { estado: 'CREATED' },
      },
      {
        key: 'to-deliver',
        count: toDeliver,
        title: toDeliver === 1 ? 'Envío en camino' : 'Envíos en camino',
        hint: 'Pendientes de marcar como entregados',
        cta: 'Marcar entrega',
        to: '/admin/shipments',
        query: { estado: 'SHIPPED' },
      },
    ];
    return todos.filter((t) => t.count > 0);
  });

  protected readonly recent = computed(() =>
    [...this.orders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
  );

  async ngOnInit(): Promise<void> {
    const timer = setInterval(() => void this.load(), REFRESH_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));

    void this.productNames.load();
    await this.load();
    this.loading.set(false);
  }

  private async load(): Promise<void> {
    try {
      const [p, o, s, n] = await Promise.all([
        this.productsApi.getProducts(),
        this.ordersApi.getOrders(),
        this.shipmentsApi.getShipments(),
        this.notificationsApi.getNotifications(),
      ]);
      this.products.set(p);
      this.orders.set(o);
      this.shipments.set(s);
      this.notifications.set(n);
      this.updatedAt.set(new Date());
      this.error.set('');
    } catch (err) {
      this.error.set(extractError(err));
    }
  }

  protected async refresh(): Promise<void> {
    this.refreshing.set(true);
    await this.load();
    this.refreshing.set(false);
  }
}
