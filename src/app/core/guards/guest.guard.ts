import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};

// Para rutas que solo existen sin sesión (la landing comparte la URL «/» con la tienda).
export const guestMatch: CanMatchFn = () => !inject(AuthService).isAuthenticated();
