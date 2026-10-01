import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePackageOpen } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import type { Order } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { formatDateTime, formatMoney } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, LucidePackageOpen, StatusBadge, CopyId, EmptyState],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.css',
})
export class OrdersList implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly ordersApi = inject(OrdersApi);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

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
