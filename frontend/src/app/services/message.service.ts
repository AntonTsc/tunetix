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
  private apiUrl = 'http://localhost/tunetix/backend';

  constructor(private http: HttpClient) { }

  // Método simple para obtener mensajes sin parámetros
  getMessages(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/Controllers/Messages/getMessages.php`, { withCredentials: true });
  }

  /**
   * Obtiene todos los mensajes con paginación y filtrado opcional
   */
  getMessagesWithParams(page = 1, limit = 10, status = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get(`${this.apiUrl}/Controllers/Messages/getMessages.php`,
      { params, withCredentials: true });
  }

  /**
   * Obtiene un mensaje específico por su ID
   */
  getMessage(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Controllers/Messages/getMessage.php?id=${id}`,
      { withCredentials: true });
  }

  /**
   * Elimina un mensaje específico
   */
  deleteMessage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Controllers/Messages/deleteMessage.php?id=${id}`,
      { withCredentials: true });
  }

  /**
   * Actualiza el estado de un mensaje
   */
  updateMessageStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/Controllers/Messages/updateStatus.php`,
      { id: id, status: status },
      { withCredentials: true });
  }

  /**
   * Obtiene estadísticas de mensajes
   */
  getMessageStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/Controllers/Messages/getStats.php`,
      { withCredentials: true });
  }

  /**
   * Envía una respuesta a un mensaje
   */
  respondMessage(messageId: number, text: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Controllers/Messages/respondMessage.php`,
      { id: messageId, response: text },
      { withCredentials: true });
  }
}
