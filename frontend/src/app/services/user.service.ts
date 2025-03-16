import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) { }

  // Método para obtener datos del usuario
  getUserProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiBaseUrl}/Controllers/Usuario/getUser.php`, {
      withCredentials: true // Importante para incluir cookies en la solicitud
    });
  }

  // Nuevo método para actualizar datos del usuario
  updateUserProfile(userData: UpdateUserData): Observable<UserResponse> {
    return this.http.post<UserResponse>(
      `${this.apiBaseUrl}/Controllers/Usuario/updateUser.php`,
      userData,
      { withCredentials: true }
    );
  }

  // Método para actualizar la contraseña (podemos implementarlo más adelante)
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/updatePassword.php`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
  }

  // Método para actualizar la imagen de perfil (podemos implementarlo más adelante)
  updateProfileImage(imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<any>(
      `${this.apiBaseUrl}/Controllers/Usuario/updateProfileImage.php`,
      formData,
      { withCredentials: true }
    );
  }
}
