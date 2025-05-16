import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard to prevent authenticated users from accessing login and register pages
 * Redirects to home page if user is already logged in
 */
export const LoggedInGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCookies().pipe(
    switchMap((data: any) => {
      // If access token is valid, user is already logged in
      if (data.data.access_token_valido) {
        console.log('LoggedInGuard: Usuario ya autenticado, redirigiendo a inicio');
        router.navigate(['/inicio']);
        return of(false);
      }

      // If there's refresh token, try to refresh and check again
      if (data.data.refresh_token) {
        return authService.refreshToken().pipe(
          map((res) => {
            if (res.status === 'OK') {
              // Successfully refreshed, so user is authenticated
              console.log('LoggedInGuard: Token refrescado exitosamente, redirigiendo a inicio');
              router.navigate(['/inicio']);
              return false;
            }
            // Failed to refresh, user can proceed to login/register
            return true;
          }),
          catchError(() => {
            // Error refreshing token, user can proceed to login/register
            return of(true);
          })
        );
      }

      // No valid tokens, user is not authenticated
      return of(true);
    }),
    catchError(() => {
      // If error occurs, allow access to login/register
      return of(true);
    })
  );
};
