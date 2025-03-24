import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) {
    // Initialize authentication state based on existing cookies
    this.authStateChanged.next(this.isAuthenticated());
  }

  baseUrl = 'http://localhost/tunetix/backend';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
  cookies: any = null;

  // Add a BehaviorSubject to track authentication state
  private authStateChanged = new BehaviorSubject<boolean>(false);
  // Observable that components can subscribe to
  authState$ = this.authStateChanged.asObservable();

  // Añadir estas propiedades al servicio
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

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
      return this.http.get(`${this.baseUrl}/auth/get_cookies.php`, { headers: this.headers, withCredentials: true })
        .pipe(
          tap((data: any) => {
            this.cookies = data.data; // Guardar las cookies en memoria
          })
        );
    }
  }

  register(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/auth/register.php`, data, {headers: this.headers, withCredentials: true})
  }

  login(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/auth/login.php`, data, {headers: this.headers, withCredentials: true})
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

              // También actualizar el estado de admin al iniciar sesión
              const isAdmin = userData.role === 'admin';
              this.isAdminSubject.next(isAdmin);
              console.log("Login: Estado admin actualizado a:", isAdmin);
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
    return this.http.get(`${this.baseUrl}/auth/logout.php`, {headers: this.headers, withCredentials: true})
      .pipe(
        tap(() => {
          // Clear user data
          localStorage.removeItem('user_data');
          // Reset cookies
          this.cookies = null;
          // Update authentication state
          this.updateAuthState(false);
          // Resetear el estado de admin
          this.isAdminSubject.next(false);
          // Your existing code...
        })
      );
  }

  validateToken(): Observable<any>{
    return this.http.get(`${this.baseUrl}/auth/validate_token.php`, {withCredentials: true})
  }

  refreshToken(){
    return this.http.get(`${this.baseUrl}/auth/refresh_token.php`, {withCredentials: true})
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

  /**
   * Obtiene el rol del usuario actual del localStorage o lo consulta al servidor
   */
  getUserRole(): Observable<string> {
    console.log("Obteniendo rol de usuario del servidor...");
    const tokenCookie = this.getCookie('access_token');
    console.log("Token cookie presente:", !!tokenCookie);

    // También intentar verificar desde localStorage para diagnóstico
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log("Role en localStorage:", user.role);
      } catch (e) {}
    }

    return this.http.get<any>(`${this.baseUrl}/Controllers/Usuario/get_user_role.php`, {
      withCredentials: true
    }).pipe(
      map(response => {
        console.log("Respuesta completa del servicio getRole:", response);
        if (response.status === 'OK' && response.data) {
          const role = response.data.role || 'user';
          console.log("Rol devuelto por el servidor:", role);
          return role;
        }
        console.log("Usando rol predeterminado 'user' porque la respuesta no es válida");
        return 'user';
      }),
      catchError(error => {
        console.error('Error obteniendo rol de usuario:', error);

        // Si falla la petición, usar el valor del localStorage como respaldo
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user && user.role) {
              console.log("Usando rol de localStorage como fallback:", user.role);
              return of(user.role);
            }
          } catch (e) {}
        }

        return of('user');
      })
    );
  }

  /**
   * Verifica si el usuario actual tiene rol de administrador
   */
  isAdmin(): Observable<boolean> {
    // Si ya tenemos el valor en el BehaviorSubject, usarlo
    if (this.isAdminSubject.value) {
      return of(true);
    }

    // Si no, verificar y actualizar
    return this.checkAndUpdateAdminStatus();
  }

  // Añadir este método
  checkAndUpdateAdminStatus(): Observable<boolean> {
    console.log("AuthService: Verificando estado de administrador...");

    // Primero intentar obtener el valor del localStorage
    const userData = localStorage.getItem('user_data');
    let initialValue = false;

    if (userData) {
      try {
        const user = JSON.parse(userData);
        initialValue = user.role === 'admin';
        // Actualizar el BehaviorSubject con el valor inicial
        this.isAdminSubject.next(initialValue);
      } catch (e) {}
    }

    // Luego verificar con el servidor y actualizar si es necesario
    if (this.isAuthenticated()) {
      return this.getUserRole().pipe(
        map(role => {
          const isAdmin = role === 'admin';
          // Solo actualizar el BehaviorSubject si el valor ha cambiado
          if (this.isAdminSubject.value !== isAdmin) {
            this.isAdminSubject.next(isAdmin);
            console.log("AuthService: Estado admin actualizado a:", isAdmin);
          }
          return isAdmin;
        }),
        catchError(error => {
          console.error("Error verificando rol admin:", error);
          // En caso de error, mantener el valor actual
          return of(this.isAdminSubject.value);
        })
      );
    }

    // Si no está autenticado, retornar el valor inicial
    return of(initialValue);
  }

  /**
   * Verifica si el usuario es administrador consultando SIEMPRE al servidor
   * Este método se utiliza para control de acceso a rutas protegidas
   */
  verifyAdminWithServer(): Observable<boolean> {
    console.log("Verificando permisos de administrador con el servidor...");

    // No usar localStorage, siempre verificar con el servidor
    return this.http.get<any>(`${this.baseUrl}/Controllers/Usuario/get_user_role.php`, {
      withCredentials: true
    }).pipe(
      map(response => {
        console.log("Respuesta de verificación admin:", response);
        if (response.status === 'OK' && response.data) {
          const isAdmin = response.data.role === 'admin';

          // Si el servidor confirma que es admin, actualizar el BehaviorSubject
          if (isAdmin) {
            this.isAdminSubject.next(true);

            // También sincronizar el localStorage para mantener consistencia
            const userData = localStorage.getItem('user_data');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                if (user.role !== 'admin') {
                  user.role = 'admin';
                  localStorage.setItem('user_data', JSON.stringify(user));
                }
              } catch (e) {}
            }
          } else {
            // Si el servidor dice que NO es admin, asegurarnos de actualizar todo
            this.isAdminSubject.next(false);

            // Corregir el localStorage si alguien lo manipuló
            const userData = localStorage.getItem('user_data');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                if (user.role === 'admin') {
                  user.role = 'user';
                  localStorage.setItem('user_data', JSON.stringify(user));
                }
              } catch (e) {}
            }
          }

          return isAdmin;
        }

        // Si no hay respuesta válida, denegar acceso
        this.isAdminSubject.next(false);
        return false;
      }),
      catchError(error => {
        console.error('Error verificando permisos de administrador:', error);
        // En caso de error, denegar acceso
        this.isAdminSubject.next(false);
        return of(false);
      })
    );
  }
}
