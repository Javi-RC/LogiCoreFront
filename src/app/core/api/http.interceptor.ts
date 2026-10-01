import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { loadAuth } from '../storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const stored = loadAuth();
  const request = req.clone({
    url: req.url.startsWith('/') ? `${environment.apiBase}${req.url}` : req.url,
    setHeaders: stored ? { Authorization: `Bearer ${stored.token}` } : {},
  });

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && window.location.pathname !== '/login') {
        auth.logout();
        void router.navigateByUrl('/login', { replaceUrl: true });
      }
      return throwError(() => error);
    }),
  );
};
