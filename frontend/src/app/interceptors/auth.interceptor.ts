import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private _auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ejecuta el interceptor directamente si la URL no es para obtener cookies o refrescar el token
    if (req.url.includes('http://localhost/backend/auth/get_cookies.php') || req.url.includes('http://localhost/backend/auth/refresh_token.php')) {
      // console.log('Excluding cookie or refresh token request');
      return next.handle(req);
    }

    return this._auth.getCookies().pipe(
      switchMap((data: any) => {
        // console.log("Cookies received:", data);

        // Continua sin token de autenticación si no las encuentra
        if (data.status === 'ERROR') {
          console.warn("Continuing without authentication token");
          return next.handle(req);
        }

        const cookies = data.data;

        if (cookies?.access_token) {
          // Clona la solicitud con el token de autenticación
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${cookies.access_token}`
            },
            withCredentials: true
          });
        }

        return next.handle(req);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error("Error getting cookies:", err);

        // Refresca el token en caso de que haya expirado
        if (err.status === 401) {
          return this._auth.refreshToken().pipe(
            switchMap((refreshData: any) => {
              if (refreshData.status === 'OK') {
                const newAccessToken = refreshData.access_token;
                req = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newAccessToken}`
                  },
                  withCredentials: true
                });
                return next.handle(req);
              } else {
                return throwError(err);
              }
            }),
            catchError(refreshErr => {
              console.error("Error refreshing token:", refreshErr);
              return throwError(refreshErr);
            })
          );
        }

        return next.handle(req);
      })
    );
  }
}
