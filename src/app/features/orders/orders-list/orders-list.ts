import { Component, OnInit, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePackageOpen } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import type { Order, OrderStatus } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { formatDateTime, formatMoney } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { Pager, paginate } from '../../../shared/ui/pager/pager';

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, LucidePackageOpen, StatusBadge, CopyId, EmptyState, Pager],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.css',
})
export class OrdersList implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ordersApi = inject(OrdersApi);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly pageSize = 10;
  protected readonly statusFilter = signal<OrderStatus | 'ALL'>('ALL');

  // Solo se ofrecen los estados en los que el cliente tiene algún pedido.
  protected readonly statusOptions = computed(() => {
    const orders = this.orders();
    const option = (value: OrderStatus, label: string) => ({
      value,
      label,
      count: orders.filter((o) => o.status === value).length,
    });
    return [
      { value: 'ALL' as const, label: 'Todos', count: orders.length },
      ...[
        option('PENDING', 'Pendientes'),
        option('CONFIRMED', 'Confirmados'),
        option('CANCELLED', 'Cancelados'),
        option('FAILED', 'Fallidos'),
      ].filter((opt) => opt.count > 0 || opt.value === this.statusFilter()),
    ];
  });

  protected readonly visible = computed(() => {
    const status = this.statusFilter();
    const orders = this.orders();
    return status === 'ALL' ? orders : orders.filter((o) => o.status === status);
  });

  protected readonly page = linkedSignal(() => {
    this.statusFilter();
    return 1;
  });
  protected readonly paged = computed(() => paginate(this.visible(), this.page(), this.pageSize));

  protected readonly skeletonRows = [1, 2, 3, 4];
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;

  async ngOnInit(): Promise<void> {
    try {
      const orders = await this.ordersApi.getOrders(this.auth.user()?.id);
      this.orders.set(orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }
}
