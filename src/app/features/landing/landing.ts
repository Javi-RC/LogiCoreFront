import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideActivity,
  LucideBoxes,
  LucideCheck,
  LucideLayoutDashboard,
  LucideLoaderCircle,
  LucideMoon,
  LucidePackageCheck,
  LucideShoppingCart,
  LucideStore,
  LucideSun,
  LucideTruck,
} from '@lucide/angular';
import { ThemeService } from '../../core/services/theme.service';
import { DemoAccess } from '../../shared/ui/demo-access/demo-access';
import { Logo } from '../../shared/ui/logo/logo';

interface PreviewStep {
  title: string;
  detail: string;
  state: 'done' | 'current' | 'pending';
}

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    DemoAccess,
    Logo,
    LucideActivity,
    LucideBoxes,
    LucideCheck,
    LucideLayoutDashboard,
    LucideLoaderCircle,
    LucideMoon,
    LucidePackageCheck,
    LucideShoppingCart,
    LucideStore,
    LucideSun,
    LucideTruck,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  protected readonly theme = inject(ThemeService);

  // Reproduce el seguimiento real de un pedido a mitad de recorrido.
  protected readonly preview: PreviewStep[] = [
    { title: 'Pedido creado', detail: 'Hemos recibido tu pedido', state: 'done' },
    { title: 'Stock reservado', detail: 'Unidades reservadas y pedido confirmado', state: 'done' },
    { title: 'Envío generado', detail: 'Estamos preparando tu paquete', state: 'done' },
    { title: 'Envío despachado', detail: 'En proceso…', state: 'current' },
    { title: 'Entregado', detail: 'El pedido llega a su destino', state: 'pending' },
  ];
}
