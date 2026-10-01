import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { extractError } from '../../../core/api/extract-error';
import { ProductsApi } from '../../../core/api/products.api';
import type { Product } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime, formatMoney } from '../../../core/util/format';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

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
  imports: [FormsModule, StatusBadge],
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
    try {
      if (product.active) {
        await this.productsApi.deactivateProduct(product.id);
      } else {
        await this.productsApi.activateProduct(product.id);
      }
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
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
    try {
      await this.productsApi.deleteProduct(product.id);
      this.toast.success('Producto eliminado');
      await this.load();
    } catch (err) {
      this.error.set(extractError(err));
    }
  }
}
