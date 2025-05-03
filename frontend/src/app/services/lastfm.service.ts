import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LastfmService {
  baseUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTopArtists(limit: number = 24, page: number = 1, sort: string = 'popularity_desc', keyword: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString())
      .set('sort', sort);

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get(`${this.baseUrl}/api/artists/getTopArtists.php`, { params })
      .pipe(
        map((response: any) => {
          if (response.status === 'OK' && response.data?.artists) {
            // No modificamos la estructura original del artista
            response.data.artists = response.data.artists.map((artist: any) => ({
              ...artist,
              // No añadimos el campo id para mantener mbid y name como identificadores
            }));
          }
          return response;
        })
      );
  }

  getTopTracks(limit: number = 24, page: number = 1, sort: string = 'popularity_desc', keyword: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString())
      .set('sort', sort);

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get(`${this.baseUrl}/api/tracks/getTopTracks.php`, { params });
  }

  getArtistMetadata(mbid: string | null = null, name: string | null = null): Observable<any> {
    let params = new HttpParams();
    
    if (mbid) {
        params = params.set('mbid', mbid);
    } else if (name) {
        params = params.set('name', name);
    }

    return this.http.get(`${this.baseUrl}/api/artists/getArtistById.php`, { params });
  }
}
