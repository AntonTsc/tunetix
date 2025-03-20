import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private _auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Avoid recursion: don't intercept requests related to cookie retrieval
    if (req.url.includes('http://localhost/tunetix/backend/auth/get_cookies.php')) {
      console.log('Excluding cookie request');
      return next.handle(req);
    }

    // Get cookies and modify the request
    return this._auth.getCookies().pipe(
      switchMap((data: any) => {
        console.log("Cookies received:", data);

        // If cookies couldn't be retrieved, continue without adding the token
        if (data.status === 'ERROR') {
          console.warn("Continuing without authentication token");
          return next.handle(req);
        }

        const cookies = data.data;

        // Check if the access_token is present
        if (cookies?.access_token) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${cookies.access_token}`
            },
            withCredentials: true
          });
        }

        return next.handle(req);  // Pass the modified request
      }),
      catchError((err) => {
        console.error("Error getting cookies:", err);
        // Continue without authentication instead of failing
        return next.handle(req);
      })
    );
  }
}
