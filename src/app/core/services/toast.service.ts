import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _items = signal<ToastItem[]>([]);

  readonly items = this._items.asReadonly();

  push(type: ToastType, message: string, duration = 4000): void {
    const id = nextId++;
    this._items.update((items) => [...items, { id, type, message }]);
    window.setTimeout(() => this.dismiss(id), duration);
  }

  // Marca el toast como saliente; se borra en remove() al acabar la animación.
  dismiss(id: number): void {
    this._items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
    );
  }

  remove(id: number): void {
    this._items.update((items) => items.filter((item) => item.id !== id));
  }

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message, 6000);
  }

  info(message: string): void {
    this.push('info', message);
  }
}
