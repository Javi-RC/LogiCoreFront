import { Component, computed, effect, input, signal } from '@angular/core';
import type { NgModel } from '@angular/forms';

// Muestra el primer error de un campo ngModel una vez tocado (o tras intentar enviar).
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <small class="field-error" role="alert">{{ text }}</small>
    }
  `,
  host: { '[attr.id]': 'id()' },
})
export class FieldError {
  readonly control = input.required<NgModel>();
  readonly id = input<string>();

  // El estado del control no es un signal: sus eventos fuerzan el recálculo.
  private readonly changes = signal(0);

  constructor() {
    effect((onCleanup) => {
      const sub = this.control().control.events.subscribe(() => this.changes.update((n) => n + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected readonly message = computed(() => {
    this.changes();
    const control = this.control();
    if (!control.invalid || !control.touched) return '';
    const errors = control.errors ?? {};
    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['email']) return 'Introduce un correo válido, por ejemplo nombre@empresa.com.';
    if (errors['minlength']) {
      return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    }
    if (errors['min']) return `El valor mínimo es ${errors['min'].min}.`;
    return 'El valor no es válido.';
  });
}
