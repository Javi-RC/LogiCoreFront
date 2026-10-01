import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractError } from '../../../core/api/extract-error';
import type { UserRole } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FieldError } from '../../../shared/ui/form/field-error';
import { ValidatedSubmit } from '../../../shared/ui/form/validated-submit';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, FieldError, ValidatedSubmit],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected name = '';
  protected email = '';
  protected password = '';
  protected role: UserRole = 'CUSTOMER';

  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.register({
        name: this.name.trim(),
        email: this.email.trim(),
        password: this.password,
        role: this.role,
      });
      void this.router.navigateByUrl('/', { replaceUrl: true });
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busy.set(false);
    }
  }
}
