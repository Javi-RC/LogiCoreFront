import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideClipboardList,
  LucideLogOut,
  LucideMoon,
  LucideShoppingCart,
  LucideStore,
  LucideSun,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ThemeService } from '../../core/services/theme.service';
import { initials } from '../../core/util/format';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideClipboardList,
    LucideLogOut,
    LucideMoon,
    LucideShoppingCart,
    LucideStore,
    LucideSun,
  ],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly userName = computed(() => this.auth.user()?.name ?? '');
  protected readonly initials = initials;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
