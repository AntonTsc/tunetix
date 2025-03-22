import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private baseUrl = 'http://localhost/backend';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) { }

  // Enviar formulario de contacto
  submitContactForm(formData: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/Controllers/Messages/submitMessage.php`,
      formData,
      {
        headers: this.headers,
        withCredentials: true // Importante para enviar cookies
      }
    );
  }

  // Obtener todos los mensajes (para panel de administración)
  getMessages(page: number = 1, limit: number = 10, status?: string): Observable<any> {
    let url = `${this.baseUrl}/Controllers/Messages/getMessages.php?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get(url, { headers: this.headers, withCredentials: true });
  }

  // Obtener un mensaje específico por ID
  getMessage(id: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/Controllers/Messages/getMessage.php?id=${id}`,
      { headers: this.headers, withCredentials: true }
    );
  }

  // Actualizar el estado de un mensaje
  updateMessageStatus(id: number, status: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/Controllers/Messages/updateStatus.php`,
      { id, status },
      { headers: this.headers, withCredentials: true }
    );
  }

  // Eliminar un mensaje
  deleteMessage(id: number): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/Controllers/Messages/deleteMessage.php?id=${id}`,
      { headers: this.headers, withCredentials: true }
    );
  }

  // Responder a un mensaje
  respondMessage(id: number, response: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/Controllers/Messages/respondMessage.php`,
      { id, response },
      { headers: this.headers, withCredentials: true }
    );
  }

  // Obtener estadísticas
  getStats(): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/Controllers/Messages/getStats.php`,
      { headers: this.headers, withCredentials: true }
    );
  }
}
