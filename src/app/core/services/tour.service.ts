import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';

const KEY_PREFIX = 'logicore.tour.';

// Guía de bienvenida: se abre sola la primera vez que cada usuario entra.
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly auth = inject(AuthService);
  private readonly _open = signal(false);

  readonly open = this._open.asReadonly();

  maybeStart(): void {
    const userId = this.auth.user()?.id;
    if (userId && !localStorage.getItem(KEY_PREFIX + userId)) this._open.set(true);
  }

  start(): void {
    this._open.set(true);
  }

  finish(): void {
    const userId = this.auth.user()?.id;
    if (userId) localStorage.setItem(KEY_PREFIX + userId, 'done');
    this._open.set(false);
  }
}
