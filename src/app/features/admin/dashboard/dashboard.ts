import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideActivity,
  LucideArrowRight,
  LucideBoxes,
  LucideCircleCheck,
  LucideClock,
  LucidePackage,
  LucidePackageOpen,
  LucideRefreshCw,
  LucideShoppingCart,
} from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { NotificationsApi } from '../../../core/api/notifications.api';
import { OrdersApi } from '../../../core/api/orders.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Notification, Order, Product, Shipment } from '../../../core/models';
import { formatDateTime, formatMoney, formatTime } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';

const REFRESH_INTERVAL_MS = 20000;

type FunnelIcon = 'clock' | 'package-open' | 'activity' | 'boxes';

interface Todo {
  key: string;
  count: number;
  title: string;
  hint: string;
  cta: string;
  to: string;
  query: Record<string, string>;
}

interface FunnelStatus {
  key: string;
  label: string;
  desc: string;
  count: number;
  icon: FunnelIcon;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    LucideActivity,
    LucideArrowRight,
    LucideBoxes,
    LucideCircleCheck,
    LucideClock,
    LucidePackage,
    LucidePackageOpen,
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

  protected readonly funnel = computed(() => {
    const orders = this.orders();
    const shipments = this.shipments();
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o) => o.status === 'CONFIRMED').length;
    const shipped = shipments.filter((s) => s.status === 'SHIPPED').length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
    const max = Math.max(pending, confirmed, shipped, delivered, 1);
    const failed = orders.filter((o) => o.status === 'FAILED' || o.status === 'CANCELLED').length;

    const statuses: FunnelStatus[] = [
      {
        key: 'PENDING',
        label: 'Pendientes',
        desc: 'esperando confirmación',
        count: pending,
        icon: 'clock',
        tone: 'pending',
      },
      {
        key: 'CONFIRMED',
        label: 'Confirmados',
        desc: 'stock reservado, saga en curso',
        count: confirmed,
        icon: 'package-open',
        tone: 'confirmed',
      },
      {
        key: 'SHIPPED',
        label: 'En camino',
        desc: 'envío despachado',
        count: shipped,
        icon: 'activity',
        tone: 'shipped',
      },
      {
        key: 'DELIVERED',
        label: 'Entregados',
        desc: 'saga completada',
        count: delivered,
        icon: 'boxes',
        tone: 'delivered',
      },
    ];

    return { orders: orders.length, delivered, failed, max, statuses };
  });

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
