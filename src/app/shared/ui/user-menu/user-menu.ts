import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideLogOut,
  LucideMoon,
  LucideSun,
  LucideUser,
} from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { initials } from '../../../core/util/format';

// Los enlaces propios de cada layout se proyectan como contenido (class="user-menu-item").
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, LucideChevronDown, LucideLogOut, LucideMoon, LucideSun, LucideUser],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class UserMenu {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly open = signal(false);
  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? ''));
  protected readonly roleLabel = computed(() =>
    this.auth.user()?.role === 'ADMIN' ? 'Administrador' : 'Cliente',
  );

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected onEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.trigger().nativeElement.focus();
  }

  protected logout(): void {
    this.open.set(false);
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
