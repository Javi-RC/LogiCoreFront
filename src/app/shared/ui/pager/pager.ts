import { Component, computed, input, model } from '@angular/core';

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const current = Math.min(page, pageCount(items.length, pageSize));
  return items.slice((current - 1) * pageSize, current * pageSize);
}

@Component({
  selector: 'app-pager',
  template: `
    @if (total() > pageSize()) {
      <nav class="pager" aria-label="Paginación">
        <span class="pager-range muted" aria-live="polite">
          {{ from() }}–{{ to() }} de {{ total() }}
        </span>
        <div class="pager-buttons">
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            [disabled]="current() <= 1"
            (click)="page.set(current() - 1)"
          >
            Anterior
          </button>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            [disabled]="current() >= pages()"
            (click)="page.set(current() + 1)"
          >
            Siguiente
          </button>
        </div>
      </nav>
    }
  `,
  styles: `
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    .pager-range {
      font-size: 0.8125rem;
    }

    .pager-buttons {
      display: flex;
      gap: 8px;
    }
  `,
})
export class Pager {
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly page = model(1);

  protected readonly pages = computed(() => pageCount(this.total(), this.pageSize()));
  protected readonly current = computed(() => Math.min(this.page(), this.pages()));
  protected readonly from = computed(() => (this.current() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.current() * this.pageSize(), this.total()));
}
