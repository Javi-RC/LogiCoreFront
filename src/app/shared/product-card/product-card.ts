import { Component, input, output, signal } from '@angular/core';
import { LucideCheck, LucideMinus, LucidePlus, LucideShoppingCart } from '@lucide/angular';
import type { Product } from '../../core/models';
import { formatMoney } from '../../core/util/format';

const MAX_QUANTITY = 99;

@Component({
  selector: 'app-product-card',
  imports: [LucideCheck, LucideMinus, LucidePlus, LucideShoppingCart],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly inCart = input(0);
  readonly add = output<number>();

  protected readonly quantity = signal(1);
  protected readonly max = MAX_QUANTITY;
  protected readonly formatMoney = formatMoney;

  protected step(delta: number): void {
    this.quantity.update((q) => Math.min(MAX_QUANTITY, Math.max(1, q + delta)));
  }

  protected emitAdd(): void {
    this.add.emit(this.quantity());
    this.quantity.set(1);
  }
}
