import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
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
const ADDED_FEEDBACK_MS = 1400;

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
  protected readonly added = signal(false);
  private addedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.addedTimer));
  }
  protected readonly max = MAX_QUANTITY;
  protected readonly formatMoney = formatMoney;

  protected step(delta: number): void {
    this.quantity.update((q) => Math.min(MAX_QUANTITY, Math.max(1, q + delta)));
  }

  protected emitAdd(): void {
    this.add.emit(this.quantity());
    this.quantity.set(1);
    this.added.set(true);
    clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.added.set(false), ADDED_FEEDBACK_MS);
  }
}
