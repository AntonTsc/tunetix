import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) { }

  baseUrl = 'http://localhost/tunetix/backend/auth';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
  cookies: any = null;

  isAuthenticated(): boolean {
    // Comprobar si las cookies access_token y refresh_token existen
    return !!this.getCookie('access_token') && !!this.getCookie('refresh_token');
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  getCookies(): Observable<any> {
    if (this.cookies) {
      // Si ya tenemos las cookies almacenadas, devolverlas sin hacer una solicitud HTTP
      return of({ data: this.cookies });
    } else {
      // Si no, hacer la solicitud HTTP
      return this.http.get(`${this.baseUrl}/get_cookies.php`, { headers: this.headers, withCredentials: true })
        .pipe(
          tap((data: any) => {
            this.cookies = data.data; // Guardar las cookies en memoria
          })
        );
    }
  }

  register(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/register.php`, data, {headers: this.headers, withCredentials: true})
  }

  login(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/login.php`, data, {headers: this.headers, withCredentials: true})
      .pipe(
        tap((response: any) => {
          // Solo hacemos algo si el login fue exitoso
          if (response.status === 'OK') {
            // Asegurarse de que se guarda toda la información del usuario, incluyendo image_path si existe
            if (response.data && response.data.image_path) {
              const userData = { ...response.data };
              localStorage.setItem('user_data', JSON.stringify(userData));
            }
          }
        }),
        catchError(error => {
          console.error('Error en la petición de login:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    // Hacer la solicitud HTTP para cerrar sesión en el servidor
    return this.http.get(`${this.baseUrl}/logout.php`, { headers: this.headers, withCredentials: true })
      .pipe(
        tap((response: any) => {
          console.log('Respuesta del servidor:', response);

          // Eliminar las cookies en memoria
          this.cookies = null;

          // Redirigir al inicio si el usuario está en una ruta no permitida
          const currentRoute = this.router.url;
          if (currentRoute.startsWith('/perfil')) {
            this.router.navigate(['/inicio']);
          }
        })
      );
  }

  validateToken(): Observable<any>{
    return this.http.get(`${this.baseUrl}/validate_token.php`, {withCredentials: true})
  }

  refreshToken(){
    return this.http.get(`${this.baseUrl}/refresh_token.php`, {withCredentials: true})
  }
}
