import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Track from '../interfaces/Track';

@Injectable({
  providedIn: 'root'
})
export class TrackService {

  constructor() { }

  private _tracks = new BehaviorSubject<Track[]>([]);
  private _loading = new BehaviorSubject<boolean>(true);

  get tracks() {
    return this._tracks.asObservable();
  }

  get loading() {
    return this._loading.asObservable();
  }

  set(tracks: Track[]) {
      this._tracks.next(tracks);
      this._loading.next(false);
  }

  setLoading(state: boolean) {
    this._loading.next(state);
  }
}
