import { Component, OnInit } from '@angular/core';
import { SpotifyService } from './services/spotify.service';
import Artist from './interfaces/Artist';
import ServerResponse from './interfaces/ServerResponse';
import { ArtistService } from './services/artist.service';
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
  constructor(private _spotify : SpotifyService, private _artists : ArtistService){}

  ngOnInit(): void {
    this.loadArtists();
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
}
