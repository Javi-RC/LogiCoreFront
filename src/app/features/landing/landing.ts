import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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

const STEP_INTERVAL_MS = 2200;

// Las mismas etapas que muestra el seguimiento real de un pedido.
const STEPS = [
  { title: 'Pedido creado', detail: 'Hemos recibido tu pedido' },
  { title: 'Stock reservado', detail: 'Unidades reservadas y pedido confirmado' },
  { title: 'Envío generado', detail: 'Estamos preparando tu paquete' },
  { title: 'Envío despachado', detail: 'El paquete sale del almacén' },
  { title: 'Entregado', detail: 'El pedido llega a su destino' },
];

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

  // Índice de la etapa en curso; al pasar de la última, el pedido está entregado.
  private readonly current = signal(3);

  protected readonly preview = computed<PreviewStep[]>(() => {
    const current = this.current();
    return STEPS.map((step, index) => ({
      title: step.title,
      detail: index === current ? 'En proceso…' : step.detail,
      state: index < current ? 'done' : index === current ? 'current' : 'pending',
    }));
  });

  protected readonly badge = computed(() => {
    const current = this.current();
    if (current >= STEPS.length) return { tone: 'delivered', label: 'Entregado' };
    return current >= 2
      ? { tone: 'confirmed', label: 'Confirmado' }
      : { tone: 'pending', label: 'Pendiente' };
  });

  constructor() {
    // Con «reducir movimiento» la vista previa se queda fija a mitad de recorrido.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(
      () => this.current.update((c) => (c >= STEPS.length ? 1 : c + 1)),
      STEP_INTERVAL_MS,
    );
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
