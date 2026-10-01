import { Component, computed, input } from '@angular/core';
import { LucideCheck, LucideCircleAlert, LucideLoaderCircle } from '@lucide/angular';
import type { Notification, NotificationType, Order, Shipment } from '../../core/models';
import { formatDateTime } from '../../core/util/format';

interface StepDef {
  key: string;
  title: string;
  desc: string;
  event?: NotificationType;
  tone: 'info' | 'success' | 'warning' | 'violet';
}

type StepState = 'done' | 'current' | 'error' | 'pending';

interface Step extends StepDef {
  state: StepState;
  occurredAt?: string;
  errorLabel?: string;
}

const defs: StepDef[] = [
  {
    key: 'created',
    title: 'Pedido creado',
    desc: 'Hemos recibido tu pedido',
    event: 'ORDER_CREATED',
    tone: 'info',
  },
  {
    key: 'confirmed',
    title: 'Stock reservado',
    desc: 'Reservamos las unidades y confirmamos el pedido',
    event: 'ORDER_CONFIRMED',
    tone: 'success',
  },
  {
    key: 'shipment-created',
    title: 'Envío generado',
    desc: 'Estamos preparando tu paquete',
    event: 'SHIPMENT_CREATED',
    tone: 'warning',
  },
  {
    key: 'shipped',
    title: 'Envío despachado',
    desc: 'El paquete sale del almacén',
    event: 'SHIPMENT_SHIPPED',
    tone: 'violet',
  },
  {
    key: 'delivered',
    title: 'Entregado',
    desc: 'El pedido ha llegado a su destino',
    tone: 'success',
  },
];

@Component({
  selector: 'app-order-timeline',
  imports: [LucideCheck, LucideCircleAlert, LucideLoaderCircle],
  templateUrl: './order-timeline.html',
  styleUrl: './order-timeline.css',
})
export class OrderTimeline {
  readonly order = input.required<Order>();
  readonly shipment = input.required<Shipment | null>();
  readonly notifications = input.required<Notification[]>();

  protected readonly formatDateTime = formatDateTime;

  private readonly terminal = computed<'cancelled' | 'failed' | null>(() => {
    const status = this.order().status;
    if (status === 'CANCELLED') return 'cancelled';
    if (status === 'FAILED') return 'failed';
    return null;
  });

  protected readonly steps = computed<Step[]>(() => {
    const byEvent = new Map(this.notifications().map((n) => [n.type, n]));
    const shipment = this.shipment();

    const mapped: Step[] = defs.map((def) => {
      if (def.key === 'delivered' && shipment?.status === 'DELIVERED') {
        return { ...def, state: 'done', occurredAt: shipment.updatedAt };
      }
      const notif = def.event ? byEvent.get(def.event) : undefined;
      if (notif) {
        return { ...def, state: 'done', occurredAt: notif.createdAt };
      }
      return { ...def, state: 'pending' };
    });

    const firstPending = mapped.findIndex((s) => s.state === 'pending');
    if (firstPending >= 0) {
      const terminal = this.terminal();
      if (terminal) {
        mapped[firstPending] = {
          ...mapped[firstPending],
          state: 'error',
          errorLabel: terminal === 'cancelled' ? 'Pedido cancelado' : 'Pedido fallido',
        };
      } else {
        mapped[firstPending] = { ...mapped[firstPending], state: 'current' };
      }
    }

    return mapped;
  });
}
