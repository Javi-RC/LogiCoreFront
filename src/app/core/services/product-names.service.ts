import { Injectable, inject, signal } from '@angular/core';
import { ProductsApi } from '../api/products.api';
import type { OrderItem } from '../models';
import { summarizeItems } from '../util/order-summary';

// Nombres de producto por ID, para mostrar los pedidos por su contenido.
@Injectable({ providedIn: 'root' })
export class ProductNamesService {
  private readonly productsApi = inject(ProductsApi);
  private readonly _names = signal<Record<string, string>>({});

  readonly names = this._names.asReadonly();

  // Es un extra: si falla, los pedidos se describen con el ID corto del producto.
  async load(): Promise<void> {
    try {
      const products = await this.productsApi.getProducts();
      this._names.set(Object.fromEntries(products.map((p) => [p.id, p.name])));
    } catch {
      /* se mantiene lo que hubiera */
    }
  }

  summarize(items: OrderItem[]): string {
    return summarizeItems(items, this._names());
  }
}
