import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApi } from '../api/auth.api';
import { extractError } from '../api/extract-error';
import { DEMO_ORDERS, DEMO_PRODUCTS } from '../demo/demo-data';
import type { AuthenticationResponse, Order, Product, Shipment, UserRole } from '../models';
import { AuthService } from './auth.service';

const CONFIRMATION_ATTEMPTS = 12;
const CONFIRMATION_INTERVAL_MS = 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Entrada en un clic con las cuentas de demostración. Si el entorno está vacío,
// carga antes un catálogo con stock y unos pedidos de ejemplo.
@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly http = inject(HttpClient);
  private readonly authApi = inject(AuthApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly enabled = environment.demo.enabled;
  readonly busy = signal<UserRole | null>(null);
  readonly status = signal('');
  readonly error = signal('');

  async enter(role: UserRole): Promise<void> {
    if (this.busy()) return;
    this.busy.set(role);
    this.error.set('');
    this.status.set('Entrando en la demo…');
    try {
      const [admin, customer] = await Promise.all([
        this.authApi.login(environment.demo.admin),
        this.authApi.login(environment.demo.customer),
      ]);
      await this.ensureSampleData(admin, customer);
      this.auth.adopt(role === 'ADMIN' ? admin : customer);
      await this.router.navigateByUrl(role === 'ADMIN' ? '/admin' : '/', { replaceUrl: true });
    } catch (err) {
      const notProvisioned = err instanceof HttpErrorResponse && err.status === 401;
      this.error.set(
        notProvisioned
          ? 'La demo no está activada en este servidor. Puedes crear una cuenta para probar la tienda.'
          : extractError(err),
      );
    } finally {
      this.busy.set(null);
      this.status.set('');
    }
  }

  // Todavía no hay sesión guardada, así que cada petición lleva su token explícito.
  private get<T>(url: string, session: AuthenticationResponse): Promise<T> {
    return firstValueFrom(this.http.get<T>(url, { headers: this.bearer(session) }));
  }

  private post<T>(url: string, body: unknown, session: AuthenticationResponse): Promise<T> {
    return firstValueFrom(this.http.post<T>(url, body, { headers: this.bearer(session) }));
  }

  private bearer(session: AuthenticationResponse): Record<string, string> {
    return { Authorization: `Bearer ${session.token}` };
  }

  private async ensureSampleData(
    admin: AuthenticationResponse,
    customer: AuthenticationResponse,
  ): Promise<void> {
    const existing = await this.get<Product[]>('/api/products', admin);
    if (existing.length > 0) return;

    this.status.set('Cargando el catálogo de ejemplo…');
    const bySku = new Map<string, Product>();
    for (const item of DEMO_PRODUCTS) {
      try {
        const { stock, ...payload } = item;
        const product = await this.post<Product>('/api/products', payload, admin);
        await this.post('/api/inventory', { productId: product.id, quantity: stock }, admin);
        bySku.set(item.sku, product);
      } catch {
        // Otra visita puede estar cargando el catálogo a la vez: se sigue con el resto.
      }
    }

    this.status.set('Creando pedidos de ejemplo…');
    try {
      await this.seedOrders(bySku, admin, customer);
    } catch {
      // Los pedidos de ejemplo son un extra: sin ellos la demo funciona igual.
    }
  }

  private async seedOrders(
    bySku: Map<string, Product>,
    admin: AuthenticationResponse,
    customer: AuthenticationResponse,
  ): Promise<void> {
    const orders: Order[] = [];
    for (const demo of DEMO_ORDERS) {
      const items = demo.items.map((item) => ({
        productId: bySku.get(item.sku)?.id,
        quantity: item.quantity,
      }));
      if (items.some((item) => !item.productId)) continue;
      orders.push(
        await this.post<Order>('/api/orders', { customerId: customer.user.id, items }, customer),
      );
    }

    const confirmed = await this.waitForConfirmation(orders, admin);
    const shipments = await this.waitForShipments(confirmed, admin);
    for (const [index, order] of orders.entries()) {
      const target = DEMO_ORDERS[index].shipment;
      const shipment = shipments.get(order.id);
      if (!shipment || target === 'created') continue;
      await this.post(`/api/shipments/${shipment.shipmentId}/ship`, null, admin);
      if (target === 'delivered') {
        await this.post(`/api/shipments/${shipment.shipmentId}/deliver`, null, admin);
      }
    }
  }

  // El envío de cada pedido confirmado lo genera la saga; aquí solo se espera a que exista.
  private async waitForShipments(
    orderIds: Set<string>,
    admin: AuthenticationResponse,
  ): Promise<Map<string, Shipment>> {
    let byOrder = new Map<string, Shipment>();
    for (let attempt = 0; attempt < CONFIRMATION_ATTEMPTS; attempt++) {
      const shipments = await this.get<Shipment[]>('/api/shipments', admin);
      byOrder = new Map(
        shipments.filter((s) => orderIds.has(s.orderId)).map((s) => [s.orderId, s]),
      );
      if (byOrder.size === orderIds.size) break;
      await wait(CONFIRMATION_INTERVAL_MS);
    }
    return byOrder;
  }

  // La saga confirma (o rechaza) los pedidos de forma asíncrona.
  private async waitForConfirmation(
    orders: Order[],
    admin: AuthenticationResponse,
  ): Promise<Set<string>> {
    const ids = new Set(orders.map((order) => order.id));
    let current: Order[] = [];
    for (let attempt = 0; attempt < CONFIRMATION_ATTEMPTS; attempt++) {
      await wait(CONFIRMATION_INTERVAL_MS);
      current = (await this.get<Order[]>('/api/orders', admin)).filter((o) => ids.has(o.id));
      if (current.every((order) => order.status !== 'PENDING')) break;
    }
    return new Set(current.filter((o) => o.status === 'CONFIRMED').map((o) => o.id));
  }
}
