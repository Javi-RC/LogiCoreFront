import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideSearch } from '@lucide/angular';
import { extractError } from '../../../core/api/extract-error';
import { ProductsApi } from '../../../core/api/products.api';
import type { Product } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime, formatMoney } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { FieldError } from '../../../shared/ui/form/field-error';
import { ValidatedSubmit } from '../../../shared/ui/form/validated-submit';
import { Pager, paginate } from '../../../shared/ui/pager/pager';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface ProductForm {
  sku: string;
  name: string;
  description: string;
  price: number | string | null;
}

function emptyForm(): ProductForm {
  return { sku: '', name: '', description: '', price: '' };
}

@Component({
  selector: 'app-products',
  imports: [FormsModule, LucideSearch, StatusBadge, FieldError, ValidatedSubmit, Pager],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productsApi = inject(ProductsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly busyId = signal<string | null>(null);

  // Query param ?buscar=… (lo usa el buscador global para enlazar a un producto).
  readonly buscar = input<string>();
  protected readonly search = linkedSignal(() => this.buscar() ?? '');
  protected readonly statusFilter = signal<StatusFilter>('ALL');

  private readonly searched = computed(() => {
    const q = this.search().trim().toLowerCase();
    const products = this.products();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  });

  protected readonly statusOptions = computed(() => {
    const products = this.searched();
    const active = products.filter((p) => p.active).length;
    return [
      { value: 'ALL' as const, label: 'Todos', count: products.length },
      { value: 'ACTIVE' as const, label: 'Activos', count: active },
      { value: 'INACTIVE' as const, label: 'Inactivos', count: products.length - active },
    ];
  });

  protected readonly visible = computed(() => {
    const status = this.statusFilter();
    const products = this.searched();
    return status === 'ALL' ? products : products.filter((p) => p.active === (status === 'ACTIVE'));
  });

  protected readonly filtered = computed(
    () => this.statusFilter() !== 'ALL' || this.search().trim() !== '',
  );

  protected readonly pageSize = 10;
  protected readonly page = linkedSignal(() => {
    this.search();
    this.statusFilter();
    return 1;
  });
  protected readonly paged = computed(() => paginate(this.visible(), this.page(), this.pageSize));

  private readonly injector = inject(Injector);
  private readonly formCard = viewChild<ElementRef<HTMLElement>>('formCard');

  protected form = emptyForm();

  protected readonly formatDateTime = formatDateTime;
  protected readonly formatMoney = formatMoney;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private async load(): Promise<void> {
    this.products.set(await this.productsApi.getProducts());
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form = emptyForm();
    this.showForm.set(true);
    this.error.set('');
    this.revealForm();
  }

  protected openEdit(product: Product): void {
    this.editingId.set(product.id);
    this.form = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
    };
    this.showForm.set(true);
    this.error.set('');
    this.revealForm();
  }

  // El formulario está encima de la tabla: al abrirlo se trae a la vista y recibe el foco.
  private revealForm(): void {
    afterNextRender(
      () => {
        const card = this.formCard()?.nativeElement;
        card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Al editar, el SKU está bloqueado: el foco va al nombre.
        const field = this.editingId() ? '#product-name' : '#product-sku';
        card?.querySelector<HTMLElement>(field)?.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  protected clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = emptyForm();
  }

  protected async submit(): Promise<void> {
    this.error.set('');
    const price = Number(this.form.price);
    if (!this.form.name.trim() || Number.isNaN(price)) {
      this.error.set('Completa nombre y un precio válido');
      return;
    }
    this.busy.set(true);
    try {
      const editingId = this.editingId();
      if (editingId) {
        await this.productsApi.updateProduct(editingId, {
          name: this.form.name.trim(),
          description: this.form.description.trim(),
          price,
        });
        this.toast.success('Producto actualizado');
      } else {
        await this.productsApi.createProduct({
          sku: this.form.sku.trim(),
          name: this.form.name.trim(),
          description: this.form.description.trim(),
          price,
        });
        this.toast.success('Producto creado');
      }
      this.closeForm();
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busy.set(false);
    }
  }

  protected async toggleActive(product: Product): Promise<void> {
    this.busyId.set(product.id);
    this.error.set('');
    try {
      if (product.active) {
        await this.productsApi.deactivateProduct(product.id);
        this.toast.info(`«${product.name}» ya no aparece en la tienda`);
      } else {
        await this.productsApi.activateProduct(product.id);
        this.toast.success(`«${product.name}» vuelve a estar en la tienda`);
      }
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busyId.set(null);
    }
  }

  protected async remove(product: Product): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar producto',
      message: `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      danger: true,
    });
    if (!ok) return;
    this.busyId.set(product.id);
    this.error.set('');
    try {
      await this.productsApi.deleteProduct(product.id);
      if (this.editingId() === product.id) this.closeForm();
      this.toast.success('Producto eliminado');
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busyId.set(null);
    }
  }
}
