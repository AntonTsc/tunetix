import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketmasterService {
  private baseUrl = 'http://localhost/tunetix/backend/api/ticketmaster/concerts/getAll.php';

  constructor(private http: HttpClient) { }

  getConcerts(limit?: number, keyword?: string, country?: string): Observable<any> {
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
    
    return this.http.get(this.baseUrl, { params });
  }
}
