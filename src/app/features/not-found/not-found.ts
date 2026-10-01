import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main class="empty page">
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
