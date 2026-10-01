import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);

  // Solo cierra si el clic es sobre el overlay.
  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.confirm.resolveTo(false);
  }
}
