import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideLogOut, LucideMoon, LucideSun } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TourService } from '../../core/services/tour.service';
import { initials } from '../../core/util/format';

@Component({
  selector: 'app-account',
  imports: [RouterLink, LucideLogOut, LucideMoon, LucideSun],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly tour = inject(TourService);
  private readonly router = inject(Router);

  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? ''));
  protected readonly memberSince = computed(() => {
    const createdAt = this.auth.user()?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
