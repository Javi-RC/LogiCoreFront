import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · LogiCore',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Crear cuenta · LogiCore',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Tienda · LogiCore',
        loadComponent: () => import('./features/shop/home/home').then((m) => m.Home),
      },
      {
        path: 'cart',
        title: 'Carrito · LogiCore',
        loadComponent: () => import('./features/shop/cart/cart').then((m) => m.Cart),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado · LogiCore',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
