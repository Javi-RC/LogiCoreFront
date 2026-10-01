import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="empty page">
      <h1>404 — Página no encontrada</h1>
      <p class="muted">La ruta que buscas no existe.</p>
      <a routerLink="/" class="btn btn-primary">Volver a la tienda</a>
    </div>
  `,
})
export class NotFound {}
