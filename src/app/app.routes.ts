import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard, guestMatch } from './core/guards/guest.guard';

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
    pathMatch: 'full',
    canMatch: [guestMatch],
    title: 'LogiCore · Del carrito a la entrega',
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
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
      {
        path: 'orders',
        title: 'Mis pedidos · LogiCore',
        loadComponent: () =>
          import('./features/orders/orders-list/orders-list').then((m) => m.OrdersList),
      },
      {
        path: 'account',
        title: 'Mi cuenta · LogiCore',
        loadComponent: () => import('./features/account/account').then((m) => m.Account),
      },
      {
        path: 'orders/:id',
        title: 'Estado del pedido · LogiCore',
        loadComponent: () =>
          import('./features/orders/order-status/order-status').then((m) => m.OrderStatus),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Dashboard · LogiCore',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'products',
        title: 'Productos · LogiCore',
        loadComponent: () => import('./features/admin/products/products').then((m) => m.Products),
      },
      {
        path: 'inventory',
        title: 'Inventario · LogiCore',
        loadComponent: () =>
          import('./features/admin/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'orders',
        title: 'Pedidos · LogiCore',
        loadComponent: () => import('./features/admin/orders/orders').then((m) => m.AdminOrders),
      },
      {
        path: 'orders/:id',
        title: 'Pedido · LogiCore',
        data: { backTo: '/admin/orders', backLabel: 'Pedidos' },
        loadComponent: () =>
          import('./features/orders/order-status/order-status').then((m) => m.OrderStatus),
      },
      {
        path: 'shipments',
        title: 'Envíos · LogiCore',
        loadComponent: () =>
          import('./features/admin/shipments/shipments').then((m) => m.Shipments),
      },
      {
        path: 'notifications',
        title: 'Actividad · LogiCore',
        loadComponent: () =>
          import('./features/admin/notifications/notifications').then((m) => m.Notifications),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado · LogiCore',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
