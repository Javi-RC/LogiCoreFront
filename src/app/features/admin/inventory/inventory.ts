import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideCircleAlert } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { InventoryApi } from '../../../core/api/inventory.api';
import { ProductsApi } from '../../../core/api/products.api';
import type { InventoryItem, Product } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { newUuid } from '../../../core/util/format';
import { FieldError } from '../../../shared/ui/form/field-error';
import { ValidatedSubmit } from '../../../shared/ui/form/validated-submit';
import { ListSkeleton } from '../../../shared/ui/list-skeleton/list-skeleton';

interface Row {
  product: Product;
  stock: InventoryItem | null;
}

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, RouterLink, LucideCircleAlert, FieldError, ValidatedSubmit, ListSkeleton],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  private readonly productsApi = inject(ProductsApi);
  private readonly inventoryApi = inject(InventoryApi);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<Product[]>([]);
  protected readonly rows = signal<Row[]>([]);
  protected readonly loading = signal(true);
  protected readonly busyProduct = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly registering = signal(false);
  protected readonly showForm = signal(false);
  protected readonly onlyLow = signal(false);

  protected readonly lowCount = computed(
    () => this.rows().filter((row) => this.lowStock(row.stock)).length,
  );
  protected readonly totals = computed(() =>
    this.rows().reduce(
      (acc, row) => ({
        available: acc.available + (row.stock?.availableQuantity ?? 0),
        reserved: acc.reserved + (row.stock?.reservedQuantity ?? 0),
      }),
      { available: 0, reserved: 0 },
    ),
  );
  protected readonly visibleRows = computed(() =>
    this.onlyLow() ? this.rows().filter((row) => this.lowStock(row.stock)) : this.rows(),
  );

  protected readonly opQty: Record<string, number> = {};
  protected registerProductId = '';
  protected registerQty = 1;

  async ngOnInit(): Promise<void> {
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private async load(): Promise<void> {
    if (this.products().length === 0) {
      this.products.set(await this.productsApi.getProducts());
    }
    const items = await Promise.all(
      this.products().map(async (product): Promise<Row> => {
        try {
          return { product, stock: await this.inventoryApi.getStock(product.id) };
        } catch {
          return { product, stock: null };
        }
      }),
    );
    this.rows.set(items.sort((a, b) => a.product.name.localeCompare(b.product.name)));
  }

  private async withBusy(productId: string, fn: () => Promise<unknown>): Promise<void> {
    this.error.set('');
    this.busyProduct.set(productId);
    try {
      await fn();
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busyProduct.set(null);
    }
  }

  private qtyOf(productId: string): number {
    return this.opQty[productId] ?? 1;
  }

  protected pctWidth(stock: InventoryItem | null, kind: 'available' | 'reserved'): string {
    if (!stock) return '0%';
    const total = stock.availableQuantity + stock.reservedQuantity;
    if (total === 0) return '0%';
    const value = kind === 'available' ? stock.availableQuantity : stock.reservedQuantity;
    return `${Math.round((value / total) * 100)}%`;
  }

  protected lowStock(stock: InventoryItem | null): boolean {
    return !!stock && stock.availableQuantity <= 5;
  }

  protected reserve(row: Row): void {
    void this.withBusy(row.product.id, () =>
      this.inventoryApi.reserveStock(row.product.id, {
        correlationId: newUuid(),
        quantity: this.qtyOf(row.product.id),
      }),
    );
  }

  protected release(row: Row): void {
    void this.withBusy(row.product.id, () =>
      this.inventoryApi.releaseStock(row.product.id, {
        correlationId: newUuid(),
        quantity: this.qtyOf(row.product.id),
      }),
    );
  }

  protected async register(): Promise<void> {
    if (!this.registerProductId || this.registerQty < 0) {
      this.error.set('Selecciona un producto y una cantidad válida');
      return;
    }
    this.registering.set(true);
    this.error.set('');
    try {
      await this.inventoryApi.registerStock({
        productId: this.registerProductId,
        quantity: this.registerQty,
      });
      this.toast.success('Stock registrado');
      this.registerProductId = '';
      this.registerQty = 1;
      this.showForm.set(false);
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.registering.set(false);
    }
  }
}
