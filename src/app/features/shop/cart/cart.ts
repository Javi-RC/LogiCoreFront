import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideMinus,
  LucidePlus,
  LucideShoppingCart,
  LucideTrash,
} from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { OrdersApi } from '../../../core/api/orders.api';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatMoney } from '../../../core/util/format';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-cart',
  imports: [
    RouterLink,
    LucideArrowLeft,
    LucideMinus,
    LucidePlus,
    LucideShoppingCart,
    LucideTrash,
    EmptyState,
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly ordersApi = inject(OrdersApi);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly formatMoney = formatMoney;

  protected async checkout(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      const order = await this.ordersApi.createOrder({
        customerId: this.auth.user()!.id,
        items: this.cart
          .lines()
          .map((line) => ({ productId: line.productId, quantity: line.quantity })),
      });
      this.cart.reset();
      this.toast.success('Pedido creado, la saga está en marcha');
      void this.router.navigate(['/orders', order.id], { replaceUrl: true });
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async clearCart(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Vaciar carrito',
      message: 'Se eliminarán todos los productos de tu carrito.',
      confirmLabel: 'Sí, vaciar',
      danger: true,
    });
    if (!ok) return;
    this.cart.reset();
    this.toast.info('Carrito vaciado');
  }
}
