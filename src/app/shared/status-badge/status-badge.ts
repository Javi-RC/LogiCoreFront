import { Component, computed, input } from '@angular/core';

const labels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  FAILED: 'Fallido',
  CREATED: 'Creado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

// Selector de atributo: el <span> pertenece al template padre, así que los
// estilos del padre lo alcanzan.
@Component({
  selector: 'span[appStatusBadge]',
  template: `{{ label() }}`,
  host: { '[class]': 'klass()' },
})
export class StatusBadge {
  readonly value = input.required<string>({ alias: 'appStatusBadge' });
  readonly tone = input<string>();

  protected readonly label = computed(() => labels[this.value()] ?? this.value());
  protected readonly klass = computed(
    () => `badge badge-${this.tone() ?? this.value().toLowerCase()}`,
  );
}
