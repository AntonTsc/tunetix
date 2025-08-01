import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  constructor(private http: HttpClient) { }

  baseUrl: string = `${environment.apiUrl}/Controllers/MetodoPago`;
  headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});

  create(data: any): Observable<any>{
    return this.http.post(`${this.baseUrl}/create.php`, data, {headers: this.headers, withCredentials: true});
  }

  getAll(): Observable<any>{
    return this.http.get(`${this.baseUrl}/getAll.php`, {headers: this.headers, withCredentials: true});
  }

  delete(id: number): Observable<any>{
    return this.http.get(`${this.baseUrl}/delete.php?id=${id}`, {headers: this.headers, withCredentials: true})
  }
}
