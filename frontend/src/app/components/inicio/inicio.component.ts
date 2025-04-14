import { Component, OnInit } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import Track from 'src/app/interfaces/Track';
import { ArtistService } from 'src/app/services/artist.service';
import { TrackService } from 'src/app/services/track.service';
import { ConcertsService } from 'src/app/services/concerts.service';
import { LastfmService } from 'src/app/services/lastfm.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  artists: Artist[] = [];
  tracks: Track[] = [];
  concerts: any[] = [];

  isLoadingArtists = true;
  isLoadingTracks = true;
  isLoadingConcerts = true;

  constructor(
    private _artists: ArtistService,
    private _lastfm: LastfmService,
    private _tracks: TrackService,
    private _concerts: ConcertsService
  ) {}

  ngOnInit(): void {
    this._lastfm.getTopArtists(6, 1, "popularity_asc", "").subscribe({
      next: (response: any) => {
        this.artists = response.data?.artists || [];
        this.isLoadingArtists = false;
      },
      error: (error) => {
        console.error("Error fetching artists from Last.fm:", error);
        this.isLoadingArtists = false;
      }
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