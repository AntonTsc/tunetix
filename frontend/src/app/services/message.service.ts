import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Método simple para obtener mensajes sin parámetros
  getMessages(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/Controllers/Messages/getMessages.php`, { withCredentials: true });
  }

  /**
   * Obtiene todos los mensajes con paginación y filtrado opcional
   */
  getMessagesWithParams(page: number = 1, perPage: number = 10, status: string = '', searchTerm: string = ''): Observable<MessageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<MessageResponse>(`${this.apiUrl}/Controllers/Messages/getMessages.php`, { params });
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
    return this.http.get<any>(`${this.apiUrl}/Controllers/Messages/stats.php`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        // console.error('Error al obtener estadísticas de mensajes:', error);
        // Devolvemos datos de fallback para que la UI no se rompa
        return of({
          status: 'OK',
          data: {
            general: {
              total: 0,
              unread: 0,
              latest: null
            },
            byStatus: {
              nuevo: 0,
              leído: 0,
              respondido: 0,
              archivado: 0
            },
            latestMessage: null
          }
        });
      })
    );
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
