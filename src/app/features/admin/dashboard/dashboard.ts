import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import {
  LucideActivity,
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
    LucideActivity,
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
    const created = shipments.filter((s) => s.status === 'CREATED').length;
    const shipped = shipments.filter((s) => s.status === 'SHIPPED').length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;
    const total = orders.length || 1;
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

    return { pending, confirmed, created, shipped, delivered, failed, total, max, statuses };
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
