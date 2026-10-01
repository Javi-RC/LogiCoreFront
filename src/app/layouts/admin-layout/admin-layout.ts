import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideActivity,
  LucideBoxes,
  LucideLayoutDashboard,
  LucideMenu,
  LucideMoon,
  LucidePackage,
  LucideShoppingCart,
  LucideStore,
  LucideSun,
  LucideTruck,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { initials } from '../../core/util/format';

type NavIcon = 'dashboard' | 'package' | 'boxes' | 'cart' | 'truck' | 'activity';

interface NavLink {
  to: string;
  label: string;
  icon: NavIcon;
}

interface NavSection {
  label: string;
  links: NavLink[];
}

@Component({
  selector: 'app-admin-layout',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideActivity,
    LucideBoxes,
    LucideLayoutDashboard,
    LucideMenu,
    LucideMoon,
    LucidePackage,
    LucideShoppingCart,
    LucideStore,
    LucideSun,
    LucideTruck,
    LucideX,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly drawerOpen = signal(false);
  protected readonly initials = initials;

  protected readonly sections: NavSection[] = [
    {
      label: 'Resumen',
      links: [{ to: '/admin', label: 'Dashboard', icon: 'dashboard' }],
    },
    {
      label: 'Catálogo',
      links: [
        { to: '/admin/products', label: 'Productos', icon: 'package' },
        { to: '/admin/inventory', label: 'Inventario', icon: 'boxes' },
      ],
    },
    {
      label: 'Operaciones',
      links: [
        { to: '/admin/orders', label: 'Pedidos', icon: 'cart' },
        { to: '/admin/shipments', label: 'Envíos', icon: 'truck' },
      ],
    },
    {
      label: 'Monitoreo',
      links: [{ to: '/admin/notifications', label: 'Actividad', icon: 'activity' }],
    },
  ];

  protected go(to: string): void {
    this.drawerOpen.set(false);
    void this.router.navigateByUrl(to);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
