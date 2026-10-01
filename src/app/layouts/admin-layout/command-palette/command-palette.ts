import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideArrowRight,
  LucidePackage,
  LucideSearch,
  LucideShoppingCart,
  LucideTruck,
} from '@lucide/angular';
import { OrdersApi } from '../../../core/api/orders.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ShipmentsApi } from '../../../core/api/shipments.api';
import type { Order, Product, Shipment } from '../../../core/models';
import { compactId, formatMoney, shortId } from '../../../core/util/format';
import { ADMIN_NAV } from '../admin-nav';

const MAX_PER_GROUP = 5;

const ORDER_STATUS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  FAILED: 'Fallido',
};

const SHIPMENT_STATUS: Record<string, string> = {
  CREATED: 'Por despachar',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
};

type ResultKind = 'section' | 'order' | 'product' | 'shipment';

interface Result {
  id: string;
  kind: ResultKind;
  title: string;
  detail: string;
  commands: string[];
  query?: Record<string, string>;
}

interface ResultGroup {
  label: string;
  items: Result[];
}

@Component({
  selector: 'app-command-palette',
  imports: [LucideArrowRight, LucidePackage, LucideSearch, LucideShoppingCart, LucideTruck],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
})
export class CommandPalette implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly shipmentsApi = inject(ShipmentsApi);

  readonly closed = output<void>();

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly previousFocus = document.activeElement as HTMLElement | null;

  protected readonly query = signal('');
  protected readonly loading = signal(true);
  private readonly orders = signal<Order[]>([]);
  private readonly products = signal<Product[]>([]);
  private readonly shipments = signal<Shipment[]>([]);

  protected readonly groups = computed<ResultGroup[]>(() => {
    const text = this.query().trim().toLowerCase();
    const idQuery = compactId(text);
    const groups: ResultGroup[] = [];

    const sections = ADMIN_NAV.flatMap((section) => section.links)
      .filter((link) => link.label.toLowerCase().includes(text))
      .map<Result>((link) => ({
        id: `cp-section-${link.icon}`,
        kind: 'section',
        title: link.label,
        detail: 'Ir a la sección',
        commands: [link.to],
      }));
    if (sections.length) groups.push({ label: 'Secciones', items: sections });
    if (!text) return groups;

    const orders = this.orders()
      .filter((o) => compactId(o.id).includes(idQuery))
      .slice(0, MAX_PER_GROUP)
      .map<Result>((o) => ({
        id: `cp-order-${o.id}`,
        kind: 'order',
        title: `Pedido ${shortId(o.id)}`,
        detail: `${ORDER_STATUS[o.status] ?? o.status} · ${formatMoney(o.total)}`,
        commands: ['/admin/orders', o.id],
      }));
    if (orders.length) groups.push({ label: 'Pedidos', items: orders });

    const products = this.products()
      .filter((p) => p.name.toLowerCase().includes(text) || p.sku.toLowerCase().includes(text))
      .slice(0, MAX_PER_GROUP)
      .map<Result>((p) => ({
        id: `cp-product-${p.id}`,
        kind: 'product',
        title: p.name,
        detail: `${p.sku} · ${formatMoney(p.price)}${p.active ? '' : ' · Inactivo'}`,
        commands: ['/admin/products'],
        query: { buscar: p.sku },
      }));
    if (products.length) groups.push({ label: 'Productos', items: products });

    const shipments = this.shipments()
      .filter((s) => compactId(s.shipmentId).includes(idQuery))
      .slice(0, MAX_PER_GROUP)
      .map<Result>((s) => ({
        id: `cp-shipment-${s.shipmentId}`,
        kind: 'shipment',
        title: `Envío ${shortId(s.shipmentId)}`,
        detail: `${SHIPMENT_STATUS[s.status] ?? s.status} · pedido ${shortId(s.orderId)}`,
        commands: ['/admin/orders', s.orderId],
      }));
    if (shipments.length) groups.push({ label: 'Envíos', items: shipments });

    return groups;
  });

  protected readonly flat = computed(() => this.groups().flatMap((group) => group.items));
  // Al cambiar los resultados, la selección vuelve al primero.
  protected readonly activeIndex = linkedSignal(() => {
    this.flat();
    return 0;
  });
  protected readonly activeId = computed(() => this.flat()[this.activeIndex()]?.id ?? null);

  constructor() {
    effect(() => {
      const id = this.activeId();
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
    });
  }

  async ngOnInit(): Promise<void> {
    this.input().nativeElement.focus();
    const [orders, products, shipments] = await Promise.allSettled([
      this.ordersApi.getOrders(),
      this.productsApi.getProducts(),
      this.shipmentsApi.getShipments(),
    ]);
    if (orders.status === 'fulfilled') this.orders.set(orders.value);
    if (products.status === 'fulfilled') this.products.set(products.value);
    if (shipments.status === 'fulfilled') this.shipments.set(shipments.value);
    this.loading.set(false);
  }

  ngOnDestroy(): void {
    this.previousFocus?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.flat().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count) this.activeIndex.update((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.activeIndex.update((i) => (i - 1 + count) % count);
        break;
      case 'Enter': {
        event.preventDefault();
        const result = this.flat()[this.activeIndex()];
        if (result) this.open(result);
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.closed.emit();
        break;
      case 'Tab':
        // El campo es el único elemento enfocable del diálogo.
        event.preventDefault();
        break;
    }
  }

  protected setActive(result: Result): void {
    this.activeIndex.set(this.flat().indexOf(result));
  }

  protected open(result: Result): void {
    this.closed.emit();
    void this.router.navigate(result.commands, { queryParams: result.query });
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}
