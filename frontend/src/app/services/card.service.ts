import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  constructor(private http: HttpClient) { }

  baseUrl: string = 'http://localhost/backend/Controllers/MetodoPago';
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});

  create(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/create.php`, data, {headers: this.headers, withCredentials: true});
  }

  getAll(): Observable<any>{
    return this.http.get(`${this.baseUrl}/create.php`, {headers: this.headers, withCredentials: true});
  }
}
