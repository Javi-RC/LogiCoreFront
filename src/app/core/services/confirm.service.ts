import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _pending = signal<PendingConfirm | null>(null);

  readonly pending = this._pending.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this._pending.set({ ...options, resolve });
    });
  }

  resolveTo(value: boolean): void {
    const resolver = this._pending()?.resolve;
    this._pending.set(null);
    resolver?.(value);
  }
}
