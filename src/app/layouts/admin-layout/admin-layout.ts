import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideActivity,
  LucideBoxes,
  LucideLayoutDashboard,
  LucideMenu,
  LucidePackage,
  LucideSearch,
  LucideShoppingCart,
  LucideStore,
  LucideTruck,
  LucideX,
} from '@lucide/angular';
import { TourService } from '../../core/services/tour.service';
import { Logo } from '../../shared/ui/logo/logo';
import { UserMenu } from '../../shared/ui/user-menu/user-menu';
import { ADMIN_NAV } from './admin-nav';
import { CommandPalette } from './command-palette/command-palette';

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
    LucidePackage,
    LucideSearch,
    LucideShoppingCart,
    LucideStore,
    LucideTruck,
    LucideX,
    UserMenu,
    CommandPalette,
    Logo,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  host: {
    '(document:keydown.escape)': 'drawerOpen.set(false)',
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class AdminLayout {
  protected readonly drawerOpen = signal(false);

  protected readonly paletteOpen = signal(false);
  protected readonly sections = ADMIN_NAV;

  constructor() {
    inject(TourService).maybeStart();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.paletteOpen.set(true);
    }
  }
}
