import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = (route, state): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // SIEMPRE verificar con el servidor para acceder a rutas admin
  return authService.verifyAdminWithServer().pipe(
    map(isAdmin => {
      if (!isAdmin) {
                router.navigate(['/inicio']);
      } else {
              }
      return isAdmin;
    }),
    catchError(error => {
      console.error("Error verificando permisos de administrador:", error);
      router.navigate(['/inicio']);
      return of(false);
    })
  );
};
