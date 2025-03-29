import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  
  constructor(private http : HttpClient) {}

  baseUrl = 'http://localhost/backend/api/spotify';
  top20ArtistasGlobal = '330902b30f904885'

  getArtists(limit?: number): Observable<any>{
    if(limit){
      return this.http.get(`${this.baseUrl}/artists/getAll.php?limit=${limit}`);
    }

    return this.http.get(`${this.baseUrl}/artists/getAll.php`);
  }

  getTracks(limit?: number): Observable<any>{
    if(limit){
      return this.http.get(`${this.baseUrl}/tracks/getAll.php?limit=${limit}`)
    }

    return this.http.get(`${this.baseUrl}/tracks/getAll.php`);
  }
}
