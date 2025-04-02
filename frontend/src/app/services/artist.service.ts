import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Artist from '../interfaces/Artist';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private _artists = new BehaviorSubject<Artist[]>([]);
  private _loading = new BehaviorSubject<boolean>(true);

  get artists() {
    return this._artists.asObservable();
  }

  get loading() {
    return this._loading.asObservable();
  }

  set(artists: Artist[]) {
    this._artists.next(artists);
    this._loading.next(false);
  }

  setLoading(state: boolean) {
    this._loading.next(state);
  }
}
