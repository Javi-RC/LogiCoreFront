import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError } from '../models';

export function extractError(err: unknown): string {
  const error = err as HttpErrorResponse;
  const data = error.error as ApiError | null | undefined;
  if (data?.message) return data.message;
  if (error.message) return error.message;
  return 'Error inesperado';
}
