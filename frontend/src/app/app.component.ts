import { Component, OnInit } from '@angular/core';
import { SpotifyService } from './services/spotify.service';
import Artist from './interfaces/Artist';
import ServerResponse from './interfaces/ServerResponse';
import { ArtistService } from './services/artist.service';
import { TrackService } from './services/track.service';
import Track from './interfaces/Track';
import { ConcertsService } from './services/concerts.service';
// import { AfterViewInit, OnInit } from '@angular/core';
// import { NavigationEnd, Router } from '@angular/router';
// import { AuthService } from './services/auth.service';
// import ServerResponse from './interfaces/ServerResponse';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  constructor
  (private _spotify: SpotifyService, 
    private _artists: ArtistService,
    private _tracks: TrackService,
    private _concerts: ConcertsService
  ){}

  ngOnInit(): void {
    this.loadArtists();
    this.loadTracks();
    this.loadConcerts();
  }

  loadArtists(){
    this._spotify.getArtists().subscribe({
      next: (response: ServerResponse) => {
        if(response.status === "OK"){
          this._artists.set(response.data as Artist[])
        }else{
          console.error(response.message);
        }
      },error: (error : ServerResponse) => {
        console.error(error.message)
      }
    })
  }

  loadTracks(){
    this._spotify.getTracks().subscribe({
      next: (response: ServerResponse) => {
        if(response.status === "OK"){
          this._tracks.set(response.data as Track[]);
        }else{
          console.error(response.message);
        }
      },
      error: (error: ServerResponse) => {
        console.error(error.message);
      }
    })
  }

  loadConcerts(){
    this._concerts.getConcerts().subscribe({
      next: (response: any) => {
        console.log(response._embedded.events)
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }
}
