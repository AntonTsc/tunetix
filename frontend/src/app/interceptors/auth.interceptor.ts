import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private _auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Evitar la recursión: no interceptar solicitudes relacionadas con la obtención de cookies
    if (req.url.includes('http://localhost/tunetix/backend/auth/get_cookies.php')) {
      console.log('Excluyendo solicitud de cookies');
      return next.handle(req);
    }

    // Obtener las cookies y modificar la solicitud
    return this._auth.getCookies().pipe(
      switchMap((data: any) => {
        console.log("Cookies recibidas:", data);
        const cookies = data.data;

        // Verificar si el access_token está presente
        if (cookies?.access_token) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${cookies.access_token}`
            },
            withCredentials: true
          });
        }

        return next.handle(req);  // Pasar la solicitud modificada
      }),
      catchError((err) => {
        console.error("Error al obtener cookies:", err);
        return throwError(() => err);  // Devuelve un error si no se obtienen cookies
      })
    );
  }
}
