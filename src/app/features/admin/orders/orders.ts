import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import type { Order } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime, formatMoney, shortId } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, RouterLink, StatusBadge],
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

  protected filterCustomer = '';

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;
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

  protected async load(): Promise<void> {
    const id = this.filterCustomer.trim();
    this.orders.set(await this.ordersApi.getOrders(id || undefined));
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
