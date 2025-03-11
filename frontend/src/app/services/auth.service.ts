import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  }

  logout(): Observable<any>{
    return this.http.get(`${this.baseUrl}/logout.php`, {withCredentials: true})
    
  }

  validateToken(): Observable<any>{
    return this.http.get(`${this.baseUrl}/validate_token.php`, {withCredentials: true})
  }

  refreshToken(){
    return this.http.get(`${this.baseUrl}/refresh_token.php`, {withCredentials: true})
  }
}
