import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideRefreshCw } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { NotificationsApi } from '../../../core/api/notifications.api';
import type { Notification } from '../../../core/models';
import { formatDateTime, formatTime } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';

const REFRESH_INTERVAL_MS = 15000;

const notifMeta: Record<string, { label: string; tone: string }> = {
  ORDER_CREATED: { label: 'Pedido creado', tone: 'info' },
  ORDER_CONFIRMED: { label: 'Pedido confirmado', tone: 'success' },
  ORDER_CANCELLED: { label: 'Pedido cancelado', tone: 'danger' },
  ORDER_FAILED: { label: 'Pedido fallido', tone: 'danger' },
  SHIPMENT_CREATED: { label: 'Envío generado', tone: 'warning' },
  SHIPMENT_SHIPPED: { label: 'Envío despachado', tone: 'violet' },
};

@Component({
  selector: 'app-notifications',
  imports: [FormsModule, LucideRefreshCw, StatusBadge, CopyId],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly notifications = signal<Notification[]>([]);
  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly updatedAt = signal<Date | null>(null);
  protected readonly error = signal('');

  protected filter = '';

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatTime = formatTime;

  async ngOnInit(): Promise<void> {
    let timer: ReturnType<typeof setInterval> | undefined;
    this.destroyRef.onDestroy(() => clearInterval(timer));

    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
    if (!this.destroyRef.destroyed) {
      timer = setInterval(() => void this.refresh(), REFRESH_INTERVAL_MS);
    }
  }

  protected notifLabel(type: string): string {
    return notifMeta[type]?.label ?? type;
  }

  protected notifTone(type: string): string {
    return notifMeta[type]?.tone ?? 'info';
  }

  private async load(): Promise<void> {
    this.error.set('');
    const id = this.filter.trim();
    this.notifications.set(
      id
        ? await this.notificationsApi.getNotificationsByCorrelation(id)
        : await this.notificationsApi.getNotifications(),
    );
    this.updatedAt.set(new Date());
  }

  protected async refresh(): Promise<void> {
    this.refreshing.set(true);
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.refreshing.set(false);
    }
  }

  // El listado se refresca en cada cambio del filtro.
  protected onFilterChange(value: string): void {
    this.filter = value;
    void this.refresh();
  }
}
