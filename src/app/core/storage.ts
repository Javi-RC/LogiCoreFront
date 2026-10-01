import type { User } from './models';

const AUTH_KEY = 'logicore.auth';
const CART_KEY = 'logicore.cart';

export interface StoredAuth {
  token: string;
  user: User;
}

export function loadAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function loadCart<T>(): T | null {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveCart<T>(value: T): void {
  localStorage.setItem(CART_KEY, JSON.stringify(value));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}
