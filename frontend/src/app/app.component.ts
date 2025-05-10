import { Component, OnInit } from '@angular/core';
import { SpotifyService } from './services/spotify.service';
import Artist from './interfaces/Artist';
import ServerResponse from './interfaces/ServerResponse';
import { ArtistService } from './services/artist.service';
import { TrackService } from './services/track.service';
import Track from './interfaces/Track';
import { ConcertsService } from './services/concerts.service';
import { TicketmasterService } from './services/ticketmaster.service';
import { AuthService } from './services/auth.service';
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
  ( 
    private _ticketmaster: TicketmasterService,
    private _concerts: ConcertsService
  ){}
  
  ngOnInit(): void {
    this.setConcerts();    
  }

  setConcerts(){
    this._concerts.setLoading(true);
    this._ticketmaster.getConcerts(6, "", "ES").subscribe({
      next: (response: ServerResponse) => {
        if(response.status === "OK"){
          this._concerts.set(response.data as any[])
        }else{
          console.error(response.message);
          this._concerts.setLoading(false);
        }
      },
      error: (error: any) => {
        console.error(error);
        this._concerts.setLoading(false);
      }
    })
  }
}
