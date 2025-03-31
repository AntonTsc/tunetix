import { Injectable } from '@angular/core';
import { User } from '../interfaces/User';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private USER_KEY = 'auth_user';

  constructor() {}

  getToken(): string | null {
    return this.getCookie('access_token');
  }

  isTokenValid(): boolean {
    return !!this.getToken();
  }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  /**
   * Guarda los datos del usuario en localStorage
   * @param user Datos del usuario a almacenar
   */
  saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Obtiene los datos del usuario almacenados en localStorage
   * @returns Datos del usuario o null
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  /**
   * Elimina los datos del usuario de localStorage
   */
  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }
}
