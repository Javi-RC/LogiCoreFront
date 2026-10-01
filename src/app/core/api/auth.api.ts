import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { AuthenticationResponse, LoginRequest, RegisterRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Promise<AuthenticationResponse> {
    return firstValueFrom(this.http.post<AuthenticationResponse>('/api/auth/login', payload));
  }

  register(payload: RegisterRequest): Promise<User> {
    return firstValueFrom(this.http.post<User>('/api/auth/register', payload));
  }
}
