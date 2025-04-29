import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  buyTickets(ticketData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Controllers/Ticket/create.php`, ticketData, {
      withCredentials: true
    });
  }

  getUserTickets(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Controllers/Ticket/getAll.php`, {
      withCredentials: true
    });
  }
}
