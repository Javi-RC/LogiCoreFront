import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Product } from '../../core/models';
import { formatMoney } from '../../core/util/format';

@Component({
  selector: 'app-product-card',
  imports: [FormsModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly add = output<number>();

  protected quantity = 1;
  protected readonly formatMoney = formatMoney;

  protected emitAdd(): void {
    this.add.emit(this.quantity);
  }
}
