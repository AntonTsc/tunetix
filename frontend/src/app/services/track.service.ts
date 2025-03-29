import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Track from '../interfaces/Track';

@Injectable({
  providedIn: 'root'
})
export class TrackService {

  constructor() { }

  private tracksStorage = new BehaviorSubject<Track[]>([]);
  tracks = this.tracksStorage.asObservable();

  set(tracks: Track[]): void{
    this.tracksStorage.next(tracks);
  }
}
