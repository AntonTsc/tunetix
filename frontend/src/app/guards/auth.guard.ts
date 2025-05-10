import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const _auth = inject(AuthService);
  const router = inject(Router);

  return _auth.getCookies().pipe(
  switchMap((data: any) => {
    if (data.data.access_token_valido) {
      return of(true);
    }

    if (data.data.refresh_token) {
      // intenta refrescar el token antes de permitir el acceso
      return _auth.refreshToken().pipe(
        map((res) => {
          if (res.status === 'OK') return true;
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }),
        catchError(() => {
          router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return of(false);
        })
      );
    }

    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return of(false);
  }),
  catchError(() => {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return of(false);
  })
);
};
