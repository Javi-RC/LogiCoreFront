import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideArrowDownWideNarrow, LucideSearch } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { ProductsApi } from '../../../core/api/products.api';
import type { Product } from '../../../core/models';
import { CartService } from '../../../core/services/cart.service';
import { ProductCard } from '../../../shared/product-card/product-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'newest';
type PriceFilter = 'all' | 'lt50' | '50-100' | 'gt100';

@Component({
  selector: 'app-home',
  imports: [FormsModule, LucideArrowDownWideNarrow, LucideSearch, ProductCard, EmptyState],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly productsApi = inject(ProductsApi);
  private readonly cart = inject(CartService);

  protected readonly products = signal<Product[]>([]);
  // Los filtros alimentan un computed, así que son signals.
  protected readonly query = signal('');
  protected readonly sortBy = signal<SortKey>('name');
  protected readonly priceFilter = signal<PriceFilter>('all');
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'name', label: 'Nombre (A–Z)' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'newest', label: 'Más recientes' },
  ];

  protected readonly priceOptions: { value: PriceFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'lt50', label: 'Menos de $50' },
    { value: '50-100', label: '$50 – $100' },
    { value: 'gt100', label: 'Más de $100' },
  ];

  protected readonly filtered = computed<Product[]>(() => {
    const q = this.query().trim().toLowerCase();
    let result = this.products();

    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }

    const priceFilter = this.priceFilter();
    const applyPrice = (p: Product): boolean => {
      switch (priceFilter) {
        case 'lt50':
          return p.price < 50;
        case '50-100':
          return p.price >= 50 && p.price <= 100;
        case 'gt100':
          return p.price > 100;
        default:
          return true;
      }
    };
    result = result.filter(applyPrice);

    const sorted = [...result];
    switch (this.sortBy()) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  });

  async ngOnInit(): Promise<void> {
    try {
      this.products.set((await this.productsApi.getProducts()).filter((p) => p.active));
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected addToCart(product: Product, quantity: number): void {
    this.cart.add(product, quantity);
  }
}
