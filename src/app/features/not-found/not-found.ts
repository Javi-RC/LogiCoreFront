import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Logo } from '../../shared/ui/logo/logo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Logo],
  template: `
    <main class="empty page">
      <app-logo [size]="48" />
      <p class="not-found-code">Error 404</p>
      <h1>Página no encontrada</h1>
      <p class="muted">La dirección no existe o el enlace ha cambiado.</p>
      <div class="not-found-actions">
        <a routerLink="/" class="btn btn-primary">Ir a la tienda</a>
        @if (auth.isAdmin()) {
          <a routerLink="/admin" class="btn btn-secondary">Ir al panel</a>
        }
      </div>
    </main>
  `,
  styles: `
    main {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    h1 {
      color: var(--ink);
    }

    .not-found-code {
      margin: 16px 0 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--primary);
    }

    .not-found-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  `,
})
export class NotFound {
  protected readonly auth = inject(AuthService);
}
