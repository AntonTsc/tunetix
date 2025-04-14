import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getArtists(limit?: number, keyword?: string, page?: number, sortBy?: string): Observable<any> {
    let params = new HttpParams();
    
    if (limit != null && limit > 0 && limit < 100) {
      params = params.set('limit', limit.toString());
    }
    
    if (keyword != null && keyword.length > 0) {
      params = params.set('name', keyword); // Cambiado a 'name' para coincidir con el backend
    }
        
    if (page != null && page >= 1) {
      params = params.set('page', page.toString());
    }
    
    if (sortBy) {
      params = params.set('sort', sortBy);
    }
    
    return this.http.get(`${this.baseUrl}/api/spotify/artists/getAll.php`, { params });
  }

  getTracks(limit?: number): Observable<any> {
    const url = limit !== undefined
      ? `${this.baseUrl}/api/spotify/tracks/getAll.php?limit=${limit}`
      : `${this.baseUrl}/api/spotify/tracks/getAll.php`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la solicitud:', error.message);
    return throwError(() => new Error('Error en la solicitud HTTP'));
  }
}
