import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideLayoutDashboard,
  LucideShoppingCart,
  LucideStore,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { TourService } from '../../core/services/tour.service';
import { UserMenu } from '../../shared/ui/user-menu/user-menu';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideClipboardList,
    LucideLayoutDashboard,
    LucideShoppingCart,
    LucideStore,
    UserMenu,
  ],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  constructor() {
    inject(TourService).maybeStart();
  }
}
