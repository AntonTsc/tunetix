import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const _auth = inject(AuthService);
  const router = inject(Router);

  return _auth.getCookies().pipe(
    map((data: any) => {
      // Si no tiene refresh_token, redirige al inicio
      if (!data.data.refresh_token) {
        router.navigate(['/inicio']);
        return false;
      }
      // Si tiene refresh_token, permite la navegación
      return true;
    }),
    catchError(() => {
      // Si hay un error en la petición de cookies (por ejemplo, cookies no disponibles), redirige al inicio
      router.navigate(['/inicio']);
      return of(false);
    })
  );
};
