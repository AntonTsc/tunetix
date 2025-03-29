import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConcertsService {

  constructor(private http: HttpClient) { }

  getConcerts(): Observable<any> {
    return this.http.get(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=zvEQbLHmIkutZ9hAmAMN87HacZPm2MRo&classificationName=music&sort=relevance,desc`)
  }
}
