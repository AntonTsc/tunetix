import { Component, OnInit } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import Track from 'src/app/interfaces/Track';
import { ArtistService } from 'src/app/services/artist.service';
import { TrackService } from 'src/app/services/track.service';
import { ConcertsService } from 'src/app/services/concerts.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  // Inicializar arrays con 6 elementos nulos para el skeleton
  artists: Artist[] = new Array(6).fill(null);
  tracks: Track[] = new Array(6).fill(null);
  concerts: any[] = new Array(6).fill(null);

  isLoadingArtists = true;
  isLoadingTracks = true;
  isLoadingConcerts = true;

  constructor(
    private _artists: ArtistService,
    private _tracks: TrackService,
    private _concerts: ConcertsService
  ) {}

  ngOnInit(): void {
    this._artists.artists.subscribe(artists => {
      if (artists.length > 0) {
        this.artists = artists;
      }
    });

    this._artists.loading.subscribe(loading => {
      this.isLoadingArtists = loading;
    });

    this._tracks.tracks.subscribe(tracks => {
      if (tracks.length > 0) {
        this.tracks = tracks;
      }
    });

    this._tracks.loading.subscribe(loading => {
      this.isLoadingTracks = loading;
    });

    this._concerts.concerts.subscribe(concerts => {
      if (concerts.length > 0) {
        this.concerts = concerts;
      }
    });

    this._concerts.loading.subscribe(loading => {
      this.isLoadingConcerts = loading;
    });
  }
}