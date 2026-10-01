import { Component, OnInit, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideSearch } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import type { Order, OrderStatus } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { compactId, formatDateTime, formatMoney, shortId } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';
import { Pager, paginate } from '../../../shared/ui/pager/pager';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, RouterLink, LucideSearch, StatusBadge, CopyId, Pager],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class AdminOrders implements OnInit {
  private readonly ordersApi = inject(OrdersApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly busyId = signal<string | null>(null);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<OrderStatus | 'ALL'>('ALL');

  // La búsqueda acepta el ID corto que muestra la tabla o el UUID completo.
  private readonly searched = computed(() => {
    const q = compactId(this.search().trim());
    const orders = this.orders();
    if (!q) return orders;
    return orders.filter((o) => compactId(o.id).includes(q) || compactId(o.customerId).includes(q));
  });

  protected readonly statusOptions = computed(() => {
    const orders = this.searched();
    const count = (status: OrderStatus) => orders.filter((o) => o.status === status).length;
    return [
      { value: 'ALL' as const, label: 'Todos', count: orders.length },
      { value: 'PENDING' as const, label: 'Pendientes', count: count('PENDING') },
      { value: 'CONFIRMED' as const, label: 'Confirmados', count: count('CONFIRMED') },
      { value: 'CANCELLED' as const, label: 'Cancelados', count: count('CANCELLED') },
      { value: 'FAILED' as const, label: 'Fallidos', count: count('FAILED') },
    ];
  });

  protected readonly visibleOrders = computed(() => {
    const status = this.statusFilter();
    const orders = this.searched();
    return status === 'ALL' ? orders : orders.filter((o) => o.status === status);
  });

  protected readonly pageSize = 10;
  // Cambiar de filtro devuelve a la primera página.
  protected readonly page = linkedSignal(() => {
    this.search();
    this.statusFilter();
    return 1;
  });
  protected readonly pagedOrders = computed(() =>
    paginate(this.visibleOrders(), this.page(), this.pageSize),
  );

  protected readonly filtered = computed(
    () => this.statusFilter() !== 'ALL' || this.search().trim() !== '',
  );

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;

  async ngOnInit(): Promise<void> {
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private async load(): Promise<void> {
    const orders = await this.ordersApi.getOrders();
    this.orders.set(orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  protected clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
  }

  protected async cancel(order: Order): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Cancelar pedido',
      message: `¿Seguro que quieres cancelar el pedido ${shortId(order.id)}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, cancelar',
      danger: true,
    });
    if (!ok) return;
    this.busyId.set(order.id);
    this.error.set('');
    try {
      await this.ordersApi.cancelOrder(order.id);
      this.toast.success(`Pedido ${shortId(order.id)} cancelado`);
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busyId.set(null);
    }
  }
}
