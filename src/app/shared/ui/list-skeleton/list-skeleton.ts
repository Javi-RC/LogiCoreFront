import { Component, computed, input } from '@angular/core';

// Marcador de carga para listas y tablas: reserva el espacio de las filas que van a llegar.
@Component({
  selector: 'app-list-skeleton',
  template: `
    <div class="list-skeleton" role="status" [attr.aria-label]="label()">
      @for (row of rowList(); track row) {
        <div class="list-skeleton-row">
          <span class="skeleton cell-wide"></span>
          <span class="skeleton cell-short"></span>
          <span class="skeleton cell-mid"></span>
          <span class="skeleton cell-short"></span>
        </div>
      }
    </div>
  `,
  styles: `
    .list-skeleton {
      display: flex;
      flex-direction: column;
    }

    .list-skeleton-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 12px;
      border-bottom: 1px solid var(--line);
    }

    .list-skeleton-row:last-child {
      border-bottom: none;
    }

    .skeleton {
      height: 14px;
    }

    .cell-wide {
      flex: 3;
    }

    .cell-mid {
      flex: 2;
    }

    .cell-short {
      flex: 1;
    }

    @media (max-width: 640px) {
      .cell-mid,
      .cell-short:last-child {
        display: none;
      }
    }
  `,
})
export class ListSkeleton {
  readonly rows = input(5);
  readonly label = input('Cargando…');

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
