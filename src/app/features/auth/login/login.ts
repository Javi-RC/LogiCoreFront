import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractError } from '../../../core/api/extract-error';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Query param ?redirect=… (withComponentInputBinding)
  readonly redirect = input<string>();

  protected email = '';
  protected password = '';

  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.login({ email: this.email.trim(), password: this.password });
      void this.router.navigateByUrl(this.redirect() ?? '/', { replaceUrl: true });
    } catch (err) {
      this.error.set(extractError(err));
    } finally {
      this.busy.set(false);
    }
  }
}
