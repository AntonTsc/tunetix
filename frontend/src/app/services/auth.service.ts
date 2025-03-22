import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) {
    // Initialize authentication state based on existing cookies
    this.authStateChanged.next(this.isAuthenticated());
  }

  baseUrl = 'http://localhost/backend/auth';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
  cookies: any = null;

  // Add a BehaviorSubject to track authentication state
  private authStateChanged = new BehaviorSubject<boolean>(false);
  // Observable that components can subscribe to
  authState$ = this.authStateChanged.asObservable();

  // Method to update auth state and notify subscribers
  private updateAuthState(isAuthenticated: boolean): void {
    this.authStateChanged.next(isAuthenticated);
  }

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
          // Only do something if login was successful
          if (response.status === 'OK') {
            // Ensure all user information is saved, including image_path if it exists
            if (response.data) {
              const userData = { ...response.data };
              localStorage.setItem('user_data', JSON.stringify(userData));

              // Reset cookies cache to force a refresh
              this.cookies = null;

              // Update authentication state to notify subscribers (like header)
              this.updateAuthState(true);
            }
          }
        }),
        catchError(error => {
          console.error('Error in login request:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    // Your existing logout code...
    // Add this line to update state when logging out
    return this.http.get(`${this.baseUrl}/logout.php`, {headers: this.headers, withCredentials: true})
      .pipe(
        tap(() => {
          // Clear user data
          localStorage.removeItem('user_data');
          // Reset cookies
          this.cookies = null;
          // Update authentication state
          this.updateAuthState(false);
          // Your existing code...
        })
      );
  }

  validateToken(): Observable<any>{
    return this.http.get(`${this.baseUrl}/validate_token.php`, {withCredentials: true})
  }

  refreshToken(){
    return this.http.get(`${this.baseUrl}/refresh_token.php`, {withCredentials: true})
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('user_data');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
}
