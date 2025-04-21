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
    return this.http.post(`${this.baseUrl}/api/ticket/create.php`, {
      cantidad: ticketData.cantidad,
      precio_individual: ticketData.precio_individual,
      precio_total: ticketData.precio_total,
      ubicacion: ticketData.ubicacion,
      artista: ticketData.artista
    });
  }
}
