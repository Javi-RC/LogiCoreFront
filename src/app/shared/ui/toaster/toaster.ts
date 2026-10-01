import { Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { ToastItem, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toaster',
  imports: [LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  templateUrl: './toaster.html',
  styleUrl: './toaster.css',
})
export class Toaster {
  protected readonly toast = inject(ToastService);

  protected onAnimationEnd(item: ToastItem): void {
    if (item.leaving) this.toast.remove(item.id);
  }
}
