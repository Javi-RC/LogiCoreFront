import { Component, computed, input, output, signal } from '@angular/core';
import {
  LucideBox,
  LucideCheck,
  LucideForklift,
  LucideHand,
  LucideMinus,
  LucidePackage,
  LucidePlus,
  LucideShoppingCart,
  LucideTag,
} from '@lucide/angular';
import type { Product } from '../../core/models';
import { formatMoney } from '../../core/util/format';
import { productVisual } from './product-visual';

const MAX_QUANTITY = 99;

@Component({
  selector: 'app-product-card',
  imports: [
    LucideBox,
    LucideCheck,
    LucideForklift,
    LucideHand,
    LucideMinus,
    LucidePackage,
    LucidePlus,
    LucideShoppingCart,
    LucideTag,
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly inCart = input(0);
  readonly add = output<number>();

  protected readonly visual = computed(() => productVisual(this.product().sku));
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
