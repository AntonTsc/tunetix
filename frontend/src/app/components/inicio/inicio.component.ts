import { Component, OnInit } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import Track from 'src/app/interfaces/Track';
import { ArtistService } from 'src/app/services/artist.service';
import { AuthService } from 'src/app/services/auth.service';
import { SpotifyService } from 'src/app/services/spotify.service';
import { TrackService } from 'src/app/services/track.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit{

  constructor
  (
    private _artists : ArtistService,
    private _tracks: TrackService
  ){}

  artists!: Artist[];
  tracks!: Track[];

  ngOnInit(): void {
    this._artists.artists.subscribe({
      next: (artists : Artist[]) => {
        this.artists = artists;
        console.log(this.artists)
      }
    })

    this._tracks.tracks.subscribe({
      next: (tracks: Track[]) => {
        this.tracks = tracks;
        console.log(this.tracks)
      }
    })
  }
}
