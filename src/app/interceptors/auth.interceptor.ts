import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.getAccessToken();

  if (token && !req.url.includes('/authenticate')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 403) {

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          authService.logout();
          return throwError(() => error);
        }

        return authService.refreshToken(refreshToken).pipe(
          switchMap((res: any) => {

            authService.saveTokens(res);

            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access_token}`
              }
            });

            return next(newReq);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
