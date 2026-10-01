import { Component, input } from '@angular/core';

// Marca de LogiCore: una «L» cuyo pie termina en flecha, sobre una baldosa del color primario.
@Component({
  selector: 'app-logo',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path
        d="M10 7v13.5h11.5M18 17l3.5 3.5L18 24"
        stroke="var(--on-primary)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
})
export class Logo {
  readonly size = input(32);
}
