import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  linkedSignal,
  viewChild,
} from '@angular/core';
import {
  LucideActivity,
  LucidePackage,
  LucidePackageCheck,
  LucideShoppingCart,
  LucideStore,
  LucideTruck,
} from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';
import { TourService } from '../../../core/services/tour.service';
import { trapTab } from '../../../core/util/focus';

type StepIcon = 'store' | 'cart' | 'tracking' | 'package' | 'truck' | 'activity';

interface TourStep {
  icon: StepIcon;
  title: string;
  text: string;
}

const CUSTOMER_STEPS: TourStep[] = [
  {
    icon: 'store',
    title: 'Explora la tienda',
    text: 'Busca por nombre o SKU, filtra por precio y añade al carrito los productos que quieras.',
  },
  {
    icon: 'cart',
    title: 'Crea tu pedido',
    text: 'En el carrito revisas cantidades y total. Al crear el pedido se reserva el stock.',
  },
  {
    icon: 'tracking',
    title: 'Síguelo en vivo',
    text: 'En «Mis pedidos» ves cada paso, desde la confirmación hasta la entrega, sin recargar la página.',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    icon: 'package',
    title: 'Prepara el catálogo',
    text: 'Crea productos en «Productos» y registra sus unidades en «Inventario» para que puedan venderse.',
  },
  {
    icon: 'cart',
    title: 'Los pedidos se confirman solos',
    text: 'Cuando un cliente compra, el sistema reserva el stock y confirma el pedido. Los verás en «Pedidos».',
  },
  {
    icon: 'truck',
    title: 'Gestiona los envíos',
    text: 'Cada pedido confirmado genera su envío. En «Envíos» lo despachas y lo marcas como entregado. El dashboard te avisa de lo pendiente.',
  },
  {
    icon: 'activity',
    title: 'Encuentra cualquier cosa',
    text: 'Pulsa Ctrl + K para buscar pedidos, productos o envíos desde cualquier pantalla. «Actividad» guarda todos los eventos.',
  },
];

@Component({
  selector: 'app-welcome-tour',
  imports: [
    LucideActivity,
    LucidePackage,
    LucidePackageCheck,
    LucideShoppingCart,
    LucideStore,
    LucideTruck,
  ],
  templateUrl: './welcome-tour.html',
  styleUrl: './welcome-tour.css',
})
export class WelcomeTour {
  protected readonly tour = inject(TourService);
  private readonly auth = inject(AuthService);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  protected readonly steps = computed(() => (this.auth.isAdmin() ? ADMIN_STEPS : CUSTOMER_STEPS));
  // Cada apertura empieza por el primer paso.
  protected readonly index = linkedSignal(() => {
    this.tour.open();
    return 0;
  });
  protected readonly step = computed(() => this.steps()[this.index()]);
  protected readonly isLast = computed(() => this.index() === this.steps().length - 1);

  constructor() {
    effect(() => {
      this.dialog()?.nativeElement.querySelector<HTMLElement>('.tour-next')?.focus();
    });
  }

  protected next(): void {
    if (this.isLast()) this.tour.finish();
    else this.index.update((i) => i + 1);
  }

  protected onKeydown(event: KeyboardEvent, container: HTMLElement): void {
    if (event.key === 'Escape') this.tour.finish();
    else if (event.key === 'Tab') trapTab(event, container);
  }
}
