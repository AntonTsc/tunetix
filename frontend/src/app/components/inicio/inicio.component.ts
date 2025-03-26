import { Component, OnInit } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { ArtistService } from 'src/app/services/artist.service';
import { AuthService } from 'src/app/services/auth.service';
import { SpotifyService } from 'src/app/services/spotify.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit{

  constructor(private _artists : ArtistService){}
  artists!: Artist[]

  ngOnInit(): void {
    this._artists.artists.subscribe({
      next: (artists : Artist[]) => {
        this.artists = artists;
        console.log(this.artists)
      }
    })
  }
}
