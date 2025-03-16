import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  baseUrl = 'http://localhost/backend/auth';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});


  register(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/register.php`, data, {headers: this.headers, withCredentials: true})
  }

  login(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/login.php`, data, {headers: this.headers, withCredentials: true})
      .pipe(
        tap((response: any) => {
          // Solo hacemos algo si el login fue exitoso
          // Si hay un error, el componente que llamó a este método debería encargarse
          if (response.status === 'OK') {
            // Podrías guardar alguna información de usuario en localStorage o sessionStorage
            // O dejarlo solo con las cookies que ya están siendo configuradas por el backend
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
          // Solo hacemos algo si el login fue exitoso
          // Si hay un error, el componente que llamó a este método debería encargarse
          if (response.status === 'OK') {
            // Podrías guardar alguna información de usuario en localStorage o sessionStorage
            // O dejarlo solo con las cookies que ya están siendo configuradas por el backend
          }
        }),
        catchError(error => {
          console.error('Error en la petición de login:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any>{
    return this.http.get(`${this.baseUrl}/logout.php`, {withCredentials: true})

  }

  validateToken(){
    return this.http.get(`${this.baseUrl}/validate_token.php`, {withCredentials: true})
  }

  refreshToken(){
    return this.http.get(`${this.baseUrl}/refresh_token.php`, {withCredentials: true})
  }
}
