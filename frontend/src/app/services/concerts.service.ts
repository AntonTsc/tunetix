import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConcertsService {
  private _concerts = new BehaviorSubject<any[]>([]);
  private _loading = new BehaviorSubject<boolean>(true);
  
  get concerts() {
    return this._concerts.asObservable();
  }
  
  get loading() {
    return this._loading.asObservable();
  }
  
  set(concerts: any[]) {
      this._concerts.next(concerts);
      this._loading.next(false);
  }

  setLoading(state: boolean) {
    this._loading.next(state);
  }

}
