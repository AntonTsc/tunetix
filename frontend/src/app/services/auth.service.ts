import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();

  private baseUrl = 'http://localhost/tunetix/backend'; // Cambia si tu backend está en otro puerto

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private restoreSession() {
    this.http.get<any>(`${this.baseUrl}/auth/user.php`, { withCredentials: true }).subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.userDataSubject.next(response.data);
          this.authStateSubject.next(true);
          this.isAdminSubject.next(response.data.role === 'admin');
        } else {
          this.userDataSubject.next(null);
          this.authStateSubject.next(false);
          this.isAdminSubject.next(false);
        }
      },
      error: () => {
        this.userDataSubject.next(null);
        this.authStateSubject.next(false);
        this.isAdminSubject.next(false);
      }
    });
  }

  refreshAccessToken(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/refresh_token.php`, {}, { withCredentials: true });
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value;
  }

  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }

  updateSessionUserData(userData: any): void {
    this.userDataSubject.next(userData);
    this.authStateSubject.next(!!userData);
    this.isAdminSubject.next(userData?.role === 'admin');
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login.php`, credentials, { withCredentials: true }).pipe(
      tap(response => {
        if (response.status === 'OK' && response.data) {
          this.updateSessionUserData(response.data);
        }
      })
    );
  }

  register(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register.php`, credentials, { withCredentials: true }).pipe(
      tap(response => {
        if (response.status === 'OK' && response.data) {
          this.updateSessionUserData(response.data);
        }
      })
    );
  }

  fetchCurrentUserData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/user.php`, { withCredentials: true }).pipe(
      tap(response => {
        if (response.status === 'OK' && response.data) {
          this.updateSessionUserData(response.data);
        }
      })
    );
  }

  checkAndUpdateAdminStatus(): Observable<boolean> {
    const user = this.userDataSubject.value;
    if (user && user.role) {
      const isAdmin = user.role === 'admin';
      this.isAdminSubject.next(isAdmin);
      return of(isAdmin);
    }
    return this.http.get<any>(`${this.baseUrl}/auth/user.php`, { withCredentials: true }).pipe(
      map(response => {
        const isAdmin = response?.data?.role === 'admin';
        this.isAdminSubject.next(isAdmin);
        return isAdmin;
      }),
      catchError(() => {
        this.isAdminSubject.next(false);
        return of(false);
      })
    );
  }

  verifyAdminWithServer(): Observable<boolean> {
    return this.http.get<any>(`${this.baseUrl}/auth/user.php`, { withCredentials: true }).pipe(
      map(response => {
        const isAdmin = response?.status === 'OK' && response?.data?.role === 'admin';
        this.isAdminSubject.next(isAdmin);
        return isAdmin;
      }),
      catchError(() => {
        this.isAdminSubject.next(false);
        return of(false);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/logout.php`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.userDataSubject.next(null);
        this.authStateSubject.next(false);
        this.isAdminSubject.next(false);
        this.router.navigate(['/login']);
      })
    );
  }

  googleLogin(): void {
    window.location.href = `${this.baseUrl}/auth/google_login.php`;
  }
}
