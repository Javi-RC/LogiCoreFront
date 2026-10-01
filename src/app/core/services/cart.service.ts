import { Injectable, computed, signal } from '@angular/core';
import type { Product } from '../models';
import { clearCart, loadCart, saveCart } from '../storage';

export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>(loadCart<CartLine[]>() ?? []);

  readonly lines = this._lines.asReadonly();

  readonly count = computed(() => this._lines().reduce((acc, line) => acc + line.quantity, 0));
  readonly total = computed(() =>
    this._lines().reduce((acc, line) => acc + line.price * line.quantity, 0),
  );
  readonly isEmpty = computed(() => this._lines().length === 0);

  add(product: Product, quantity = 1): void {
    const lines = this._lines();
    const existing = lines.find((line) => line.productId === product.id);
    if (existing) {
      this.commit(
        lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + quantity } : line,
        ),
      );
    } else {
      this.commit([
        ...lines,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity,
        },
      ]);
    }
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this.commit(
      this._lines().map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    );
  }

  remove(productId: string): void {
    this.commit(this._lines().filter((line) => line.productId !== productId));
  }

  reset(): void {
    this._lines.set([]);
    clearCart();
  }

  // Toda mutación pasa por aquí: actualiza el signal y persiste.
  private commit(lines: CartLine[]): void {
    this._lines.set(lines);
    saveCart(lines);
  }
}
