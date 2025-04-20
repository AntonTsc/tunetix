import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

    return this.http.get(`${this.baseUrl}/api/artists/getTopArtists.php`, { params });
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
}
