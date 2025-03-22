import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
  private apiBaseUrl = 'http://localhost/backend';

  // BehaviorSubject para mantener y emitir los datos actualizados del usuario
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Método para obtener datos del usuario
  getUserProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiBaseUrl}/Controllers/Usuario/getUser.php`, {
      withCredentials: true // Importante para incluir cookies en la solicitud
    }).pipe(
      tap((response) => {
        if (response.status === 'OK' && response.data) {
          // Actualizar el BehaviorSubject con los nuevos datos
          this.userDataSubject.next(response.data);
        }
      })
    );
  }

  // Nuevo método para actualizar datos del usuario
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
  updateProfileImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/updateProfileImage.php`,
      formData,
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
}
