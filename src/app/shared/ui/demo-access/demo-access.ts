import { Component, inject, input } from '@angular/core';
import { LucideLayoutDashboard, LucideStore } from '@lucide/angular';
import { DemoService } from '../../../core/services/demo.service';

// Botones de entrada a la demo. `tone="light"` es para fondos de color (hero de la landing).
@Component({
  selector: 'app-demo-access',
  imports: [LucideLayoutDashboard, LucideStore],
  templateUrl: './demo-access.html',
  styleUrl: './demo-access.css',
})
export class DemoAccess {
  protected readonly demo = inject(DemoService);

  readonly tone = input<'default' | 'light'>('default');
}
