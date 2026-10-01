import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateProductPayload, Product, UpdateProductPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  getProducts(): Promise<Product[]> {
    return firstValueFrom(this.http.get<Product[]>('/api/products'));
  }

  getProduct(id: string): Promise<Product> {
    return firstValueFrom(this.http.get<Product>(`/api/products/${id}`));
  }

  createProduct(payload: CreateProductPayload): Promise<Product> {
    return firstValueFrom(this.http.post<Product>('/api/products', payload));
  }

  updateProduct(id: string, payload: UpdateProductPayload): Promise<Product> {
    return firstValueFrom(this.http.put<Product>(`/api/products/${id}`, payload));
  }

  deleteProduct(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/products/${id}`));
  }

  activateProduct(id: string): Promise<Product> {
    return firstValueFrom(this.http.post<Product>(`/api/products/${id}/activate`, null));
  }

  deactivateProduct(id: string): Promise<Product> {
    return firstValueFrom(this.http.post<Product>(`/api/products/${id}/deactivate`, null));
  }
}
