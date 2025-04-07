import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

  getArtists(limit?: number): Observable<any> {
    const url = limit
      ? `${this.baseUrl}/api/spotify/artists/getAll.php?limit=${limit}`
      : `${this.baseUrl}/api/spotify/artists/getAll.php`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  getTracks(limit?: number): Observable<any> {
    const url = limit
      ? `${this.baseUrl}/api/spotify/tracks/getAll.php?limit=${limit}`
      : `${this.baseUrl}/api/spotify/tracks/getAll.php`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la solicitud:', error.message);
    return throwError(() => new Error('Error en la solicitud HTTP'));
  }
}
