import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '**',
    title: 'No encontrado · LogiCore',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
