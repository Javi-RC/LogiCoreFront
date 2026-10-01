import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideRefreshCw, LucideSearch } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { NotificationsApi } from '../../../core/api/notifications.api';
import type { Notification } from '../../../core/models';
import { compactId, formatDateTime, formatTime } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { CopyId } from '../../../shared/ui/copy-id/copy-id';
import { Pager, paginate } from '../../../shared/ui/pager/pager';

const REFRESH_INTERVAL_MS = 15000;

type TypeFilter = 'ALL' | 'ORDER' | 'SHIPMENT' | 'ISSUE';

const typeMatches: Record<TypeFilter, (type: string) => boolean> = {
  ALL: () => true,
  ORDER: (type) => type.startsWith('ORDER_'),
  SHIPMENT: (type) => type.startsWith('SHIPMENT_'),
  ISSUE: (type) => type === 'ORDER_CANCELLED' || type === 'ORDER_FAILED',
};

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
  imports: [FormsModule, LucideRefreshCw, LucideSearch, StatusBadge, CopyId, Pager],
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

  protected readonly filter = signal('');

  protected readonly typeFilter = signal<TypeFilter>('ALL');

  // Se filtra en cliente para aceptar el ID corto que muestra la interfaz.
  private readonly byOrder = computed(() => {
    const q = compactId(this.filter().trim());
    const all = this.notifications();
    return q ? all.filter((n) => compactId(n.correlationId).includes(q)) : all;
  });

  protected readonly typeOptions = computed(() => {
    const items = this.byOrder();
    const option = (value: TypeFilter, label: string) => ({
      value,
      label,
      count: items.filter((n) => typeMatches[value](n.type)).length,
    });
    return [
      option('ALL', 'Todos'),
      option('ORDER', 'Pedidos'),
      option('SHIPMENT', 'Envíos'),
      option('ISSUE', 'Incidencias'),
    ];
  });

  protected readonly visible = computed(() => {
    const matches = typeMatches[this.typeFilter()];
    return this.byOrder().filter((n) => matches(n.type));
  });

  protected readonly pageSize = 20;
  // Solo el filtro reinicia la página; el refresco automático la conserva.
  protected readonly page = linkedSignal(() => {
    this.filter();
    this.typeFilter();
    return 1;
  });
  protected readonly paged = computed(() => paginate(this.visible(), this.page(), this.pageSize));

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

  protected clearFilters(): void {
    this.filter.set('');
    this.typeFilter.set('ALL');
  }

  protected notifLabel(type: string): string {
    return notifMeta[type]?.label ?? type;
  }

  protected notifTone(type: string): string {
    return notifMeta[type]?.tone ?? 'info';
  }

  private async load(): Promise<void> {
    this.error.set('');
    this.notifications.set(await this.notificationsApi.getNotifications());
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
}
