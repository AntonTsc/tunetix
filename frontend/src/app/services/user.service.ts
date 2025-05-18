import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import ServerResponse from '../interfaces/ServerResponse';
import { AuthService } from './auth.service';

export interface UserResponse {
  status: string;
  message: string;
  data: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    image_path: string;
    created_at: string;
    updated_at: string;
  };
}

export interface UpdateUserData {
  name?: string;
  lastName?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiBaseUrl = environment.apiUrl;

  // BehaviorSubject para mantener y emitir los datos actualizados del usuario
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();

  // Variable para controlar si ya se inició la descarga de la imagen de Google
  private googleImageDownloadStarted = false;

  // Corregimos la inyección de dependencias usando el constructor
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Suscribirse a cambios en los datos de usuario del AuthService
    this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.userDataSubject.next(userData);
      }
    });
  }

  // Método para obtener datos del usuario
  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/Controllers/Usuario/getUser.php`, {
      withCredentials: true // Importante para incluir cookies en la solicitud
    }).pipe(
      tap((response) => {
        // Esto es crucial: actualizar el subject para que las suscripciones se activen
        if (response && response.status === 'OK' && response.data) {
          // Actualizar el BehaviorSubject con los nuevos datos
          this.userDataSubject.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para actualizar datos del usuario
  updateUserProfile(userData: UpdateUserData): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${this.apiBaseUrl}/Controllers/Usuario/updateUser.php`,
      userData,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        if (response.status === 'OK' && response.data) {
          // Actualizar el BehaviorSubject con los nuevos datos
          this.userDataSubject.next(response.data);
        }
      })
    );
  }

  // Método para actualizar la contraseña
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/updatePassword.php`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
  }

  // Método para actualizar la imagen de perfil
  updateProfileImage(formData: FormData): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(
      `${this.apiBaseUrl}/Controllers/Usuario/updateProfileImage.php`,
      formData,
      { withCredentials: true }  // Añadir esta opción para incluir las cookies de sesión
    ).pipe(
      tap((response: ServerResponse) => {
        // Si la actualización es exitosa, actualizar los datos del usuario en el BehaviorSubject
        if (response.status === 'OK' && response.data) {
          const currentData = this.userDataSubject.getValue();
          if (currentData) {
            this.userDataSubject.next({
              ...currentData,
              image_path: response.data.image_path
            });
          }
        }
      }),
      catchError(error => {
        console.error('Error en updateProfileImage:', error);
        return throwError(() => new Error('Error al actualizar la imagen de perfil'));
      })
    );
  }

  // Método para eliminar la imagen de perfil (solo mediante base de datos)
  deleteProfileImage(): Observable<any> {
    return this.http.delete<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/deleteProfileImage.php`,
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        if (response.status === 'OK') {
          // Actualizar el BehaviorSubject con los nuevos datos del usuario sin imagen
          this.userDataSubject.next({
            ...this.userDataSubject.getValue(),
            image_path: null
          });
        }
      }),
      catchError(error => {
        console.error('Error al eliminar imagen de perfil:', error);
        return throwError(() => new Error('Error al eliminar la imagen de perfil'));
      })
    );
  }

  /**
   * Obtiene todos los usuarios (solo para administradores)
   */
  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/Controllers/Usuario/admin/getAllUsers.php`, {
      withCredentials: true
    });
  }

  /**
   * Actualiza el rol de un usuario (solo para administradores)
   */
  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/Controllers/Usuario/admin/updateUserRole.php`, {
      userId,
      role
    }, {
      withCredentials: true
    });
  }

  /**
   * Updates user role and forces immediate effect
   */
  updateUserRoleImmediate(userId: number, role: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/admin/updateUserRoleImmediate.php`,
      {
        userId,
        role
      },
      {
        withCredentials: true
      }
    ).pipe(
      // If target user is the current user, refresh admin status
      tap(response => {
        if (response.status === 'OK') {
          // Force re-check of admin status in the AuthService
          this.authService.checkAndUpdateAdminStatus().subscribe();
        }
      })
    );
  }

  // Añadir nuevo método para gestionar la adición de contraseña a cuentas de Google
  // Corrección para no usar tokenService
  addGooglePassword(newPassword: string): Observable<ServerResponse> {
    // Simplificar el método para usar sólo withCredentials (las cookies)
    return this.http.post<ServerResponse>(
      `${this.apiBaseUrl}/Controllers/Usuario/addGooglePassword.php`,
      { newPassword },
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Error al añadir contraseña a cuenta Google:', error);
        return throwError(() => error);
      })
    );
  }

  // Añadir método para detectar y descargar automáticamente imágenes de Google
  downloadGoogleProfileImage(): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(
      `${this.apiBaseUrl}/Controllers/Usuario/downloadGoogleProfileImage.php`,
      {},
      { withCredentials: true }
    ).pipe(
      tap((response: ServerResponse) => {
        if (response.status === 'OK' && response.data) {
          const currentData = this.userDataSubject.getValue();
          if (currentData) {
            this.userDataSubject.next({
              ...currentData,
              image_path: response.data.image_path
            });
          }
        }
      }),
      catchError(error => {
        console.error('Error descargando imagen de Google:', error);
        return throwError(() => new Error('Error al descargar la imagen de Google'));
      })
    );
  }

  // Método para obtener la URL apropiada de la imagen de perfil
  getProfileImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return '';
    }

    // Si es una URL de Google, iniciar descarga automática (asíncrona) SOLO UNA VEZ
    if (imagePath.startsWith('http') && imagePath.includes('googleusercontent.com') && !this.googleImageDownloadStarted) {
      // Marcar que ya se inició la descarga para evitar duplicados
      this.googleImageDownloadStarted = true;

      // Usar setTimeout para no bloquear la UI y ejecutar de forma asíncrona
      setTimeout(() => {
        this.downloadGoogleProfileImage().subscribe({
          error: (err) => {
            console.error('Error al descargar imagen de Google:', err);
            // Resetear la bandera en caso de error para permitir reintentos
            this.googleImageDownloadStarted = false;
          }
        });
      }, 0);

      // Devolver la URL externa directamente
      return imagePath;
    }

    // Para rutas relativas, construir la URL completa con la base API
    if (!imagePath.startsWith('http')) {
      return `${this.apiBaseUrl}/${imagePath}`;
    }

    // Si es otra URL externa, devolverla sin modificar
    return imagePath;
  }
}
