import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServerResponse, User } from '../interfaces/User';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router, private tokenService: TokenService) {
    // Initialize authentication state based on existing cookies
    this.authStateChanged.next(this.isAuthenticated());

    // Check admin status on initialization if authenticated
    if (this.isAuthenticated()) {
      this.checkAndUpdateAdminStatus().subscribe();
    }
  }

  baseUrl = 'http://localhost/tunetix/backend';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
  cookies: any = null;

  // BehaviorSubject para datos básicos del usuario
  private userDataSubject = new BehaviorSubject<any>(null);
  userData$ = this.userDataSubject.asObservable();

  // Add a BehaviorSubject to track authentication state
  private authStateChanged = new BehaviorSubject<boolean>(false);
  // Observable that components can subscribe to
  authState$ = this.authStateChanged.asObservable();

  // Public Subject for Admin status tracking
  public isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

  // Method to update auth state and notify subscribers
  private updateAuthState(isAuthenticated: boolean): void {
    this.authStateChanged.next(isAuthenticated);

    // Si no está autenticado, limpiar datos de usuario
    if (!isAuthenticated) {
      this.userDataSubject.next(null);
    }
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
      return this.http.get(`${this.baseUrl}/auth/get_cookies.php`, { headers: this.headers, withCredentials: true })
        .pipe(
          tap((data: any) => {
            this.cookies = data.data; // Guardar las cookies en memoria
          })
        );
    }
  }

  register(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/auth/register.php`, data, {headers: this.headers, withCredentials: true});
  }

  login(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/auth/login.php`, data, {headers: this.headers, withCredentials: true})
      .pipe(
        tap((response: any) => {
          // Only do something if login was successful
          if (response.status === 'OK') {
            // Reset cookies cache to force a refresh
            this.cookies = null;

            // Update authentication state to notify subscribers
            this.updateAuthState(true);

            // Store basic user data in BehaviorSubject (WITHOUT role)
            if (response.data) {
              const userData = {
                id: response.data.id,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                email: response.data.email,
                image_path: response.data.image_path
              };
              // Update the user data subject
              this.userDataSubject.next(userData);
            }

            // Query database for role and update status
            this.checkAndUpdateAdminStatus().subscribe();
          }
        }),
        catchError(error => {
          console.error('Error in login request:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/logout.php`, {headers: this.headers, withCredentials: true})
      .pipe(
        tap(() => {
          // Reset cookies
          this.cookies = null;
          // Update authentication state (this also clears user data)
          this.updateAuthState(false);
          // Reset admin status
          this.isAdminSubject.next(false);
        })
      );
  }

  validateToken(): Observable<any>{
    return this.http.get(`${this.baseUrl}/auth/validate_token.php`, {withCredentials: true});
  }

  refreshToken(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/refresh_token.php`, {withCredentials: true});
  }

  /**
   * Obtiene datos del usuario actual desde el servidor.
   * Reemplaza el uso de localStorage.
   */
  fetchCurrentUserData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Controllers/Usuario/getUser.php`, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.status === 'OK' && response.data) {
          // Actualizar el BehaviorSubject con los datos del usuario
          this.userDataSubject.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error fetching user data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets user role directly from the server, never from localStorage
   */
  getUserRole(): Observable<string> {
    return this.http.get<any>(`${this.baseUrl}/Controllers/Usuario/get_user_role.php`, {
      withCredentials: true
    }).pipe(
      map(response => {
        if (response.status === 'OK' && response.data) {
          return response.data.role;
        }
        return 'user';
      }),
      catchError(error => {
        console.error('Error getting user role:', error);
        return of('user');
      })
    );
  }

  /**
   * Verifies if the current user has admin role by checking the BehaviorSubject value
   * or querying the server if needed
   */
  checkIsAdmin(): Observable<boolean> {
    // If user isn't authenticated, they can't be admin
    if (!this.isAuthenticated()) {
      return of(false);
    }

    // If we already have the admin status, return it
    // Otherwise check with the server
    return this.checkAndUpdateAdminStatus();
  }

  /**
   * Updates admin status by querying the server
   */
  checkAndUpdateAdminStatus(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      this.isAdminSubject.next(false);
      return of(false);
    }

    // Always verify with server
    return this.getUserRole().pipe(
      map(role => {
        const isAdmin = role === 'admin';
        this.isAdminSubject.next(isAdmin);
        return isAdmin;
      }),
      catchError(() => {
        this.isAdminSubject.next(false);
        return of(false);
      })
    );
  }

  /**
   * Verifies if the user is admin by always querying the server
   * Used for route protection
   */
  verifyAdminWithServer(): Observable<boolean> {

    return this.http.get<any>(`${this.baseUrl}/Controllers/Usuario/get_user_role.php`, {
      withCredentials: true
    }).pipe(
      map(response => {
        const isAdmin = response.status === 'OK' &&
                       response.data &&
                       response.data.role === 'admin';

        // Update the BehaviorSubject for consistency
        this.isAdminSubject.next(isAdmin);
        return isAdmin;
      }),
      catchError(error => {
        console.error('Admin verification error:', error);
        this.isAdminSubject.next(false);
        return of(false);
      })
    );
  }

  /**
   * Gets the current admin status from the BehaviorSubject
   * Warning: This might not reflect the actual server state
   */
  getAdminStatus(): boolean {
    return this.isAdminSubject.value;
  }

  // Utiliza TokenService para verificar si hay un token
  checkAuthStatus(): Observable<boolean> {
    if (this.tokenService.isTokenValid()) {
      return this.validateToken().pipe(
        map(response => {
          if (response && response.status === 'OK') {
            this.updateAuthState(true);
            return true;
          }
          this.updateAuthState(false);
          return false;
        }),
        catchError(error => {
          console.error('Error validating token:', error);
          this.updateAuthState(false);
          return of(false);
        })
      );
    } else {
      // No hay token, el usuario no está autenticado
      this.updateAuthState(false);
      return of(false);
    }
  }

  // Añade este método para refrescar explícitamente los datos de usuario
  refreshUserData(): Observable<User> {
    return this.http.get<ServerResponse>(`${this.baseUrl}/Controllers/Usuario/getUser.php`, {
      withCredentials: true
    }).pipe(
      map(response => {
        if (response.status === 'OK' && response.data) {
          const userData = response.data as User;
          this.userDataSubject.next(userData);
          return userData;
        }
        throw new Error('No se pudieron obtener los datos del usuario');
      }),
      catchError(error => {
        console.error('Error al refrescar datos de usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // Llama a este método después de actualizar los datos del usuario
  updateUserProfile(data: any): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(`${this.baseUrl}/Controllers/Usuario/updateUser.php`, data, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.status === 'OK') {
          // Actualiza inmediatamente los datos locales
          this.refreshUserData().subscribe();
        }
      })
    );
  }

  // Método para obtener los datos actuales del usuario de forma sincrónica
  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }
}
