import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthApi } from '../api/auth.api';
import type { AuthenticationResponse, LoginRequest, RegisterRequest, User } from '../models';
import { clearAuth, loadAuth, saveAuth } from '../storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);

  private readonly _token = signal<string | null>(loadAuth()?.token ?? null);
  private readonly _user = signal<User | null>(loadAuth()?.user ?? null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();

  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  async login(payload: LoginRequest): Promise<User> {
    const response = await this.authApi.login(payload);
    this.adopt(response);
    return response.user;
  }

  // Inicia la sesión a partir de una respuesta de login ya obtenida.
  adopt(response: AuthenticationResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);
    saveAuth({ token: response.token, user: response.user });
  }

  async register(payload: RegisterRequest): Promise<User> {
    await this.authApi.register(payload);
    return this.login({ email: payload.email, password: payload.password });
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    clearAuth();
  }
}
