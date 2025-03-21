import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface MessageResponse {
  status: string;
  message: string;
  data: any[];
  pagination: {
    total: number;
    new_count: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = 'http://localhost/tunetix/backend';

  constructor(private http: HttpClient) { }

  // Método simple para obtener mensajes sin parámetros
  getMessages(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.baseUrl}/Controllers/Messages/getMessages.php`, { withCredentials: true });
  }

  // Método con parámetros para paginación y filtrado
  getMessagesWithParams(page: number = 1, limit: number = 10, status: string = ''): Observable<MessageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<MessageResponse>(`${this.baseUrl}/Controllers/Messages/getMessages.php`, {
      params,
      withCredentials: true
    });
  }

  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/Controllers/Messages/deleteMessage.php?id=${id}`, { withCredentials: true });
  }

  updateMessageStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/Controllers/Messages/updateStatus.php`,
      { id, status },
      { withCredentials: true }
    );
  }

  getMessage(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Controllers/Messages/getMessage.php?id=${id}`, { withCredentials: true });
  }
}
