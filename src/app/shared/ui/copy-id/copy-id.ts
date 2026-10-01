import { Component, inject, input, signal } from '@angular/core';
import { LucideCheck, LucideCopy } from '@lucide/angular';
import { ToastService } from '../../../core/services/toast.service';
import { copyToClipboard, shortId } from '../../../core/util/format';

@Component({
  selector: 'app-copy-id',
  imports: [LucideCheck, LucideCopy],
  templateUrl: './copy-id.html',
  styleUrl: './copy-id.css',
})
export class CopyId {
  readonly value = input.required<string>();
  readonly length = input<number>();

  private readonly toast = inject(ToastService);

  protected readonly copied = signal(false);
  protected readonly shortId = shortId;

  protected async copy(): Promise<void> {
    const ok = await copyToClipboard(this.value());
    if (ok) {
      this.copied.set(true);
      this.toast.success('ID copiado al portapapeles');
      window.setTimeout(() => this.copied.set(false), 2000);
    } else {
      this.toast.error('No se pudo copiar el ID');
    }
  }
}
