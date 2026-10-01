import { Component, input } from '@angular/core';

// Slots: marca el icono con el atributo `emptyIcon` y la acción con `emptyAction`.
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <ng-content select="[emptyIcon]" />
      <h3 class="empty-title">{{ title() }}</h3>
      @if (description()) {
        <p class="empty-description">{{ description() }}</p>
      }
      <div class="empty-action">
        <ng-content select="[emptyAction]" />
      </div>
    </div>
  `,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
