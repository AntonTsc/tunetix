import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const _auth = inject(AuthService);
  const router = inject(Router);

  return _auth.getCookies().pipe(
    map((data: any) => {
      // Si no tiene refresh_token, redirige al login
      if (!data.data.refresh_token) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
      // Si tiene refresh_token, permite la navegación
      return true;
    }),
    catchError(() => {
      // Si hay un error en la petición de cookies, redirige al login
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};
