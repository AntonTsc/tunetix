import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Artist from '../interfaces/Artist';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {

  constructor() { }

  private artistsStorage = new BehaviorSubject<Artist[]>([]);
  artists = this.artistsStorage.asObservable();

  set(artists: Artist[]): void{
    this.artistsStorage.next(artists);
  }
}
