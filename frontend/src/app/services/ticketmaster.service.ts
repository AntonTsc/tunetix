import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TicketmasterService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getConcerts(limit?: number, keyword?: string, country?: string, page?: number, sortBy?: string): Observable<any> {
    let params = new HttpParams();

    if(limit != null && limit > 0 && limit < 100){
      params = params.set('limit', limit.toString());
    }

    if(keyword != null && keyword.length > 0){
      params = params.set('keyword', keyword);
    }

    if(country != null && country.length > 0){
      params = params.set('countryCode', country);
    }

    if(page != null && page >= 0){
      params = params.set('page', page.toString());
    }

    if(sortBy) {
      params = params.set('sort', sortBy);
    }

    return this.http.get(`${this.baseUrl}/api/ticketmaster/concerts/getAll.php`, { params });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/ticketmaster/concerts/getById.php?id=${id}`);
  }
}
