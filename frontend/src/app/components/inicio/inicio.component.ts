import { Component, OnInit } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';
import { SpotifyService } from 'src/app/services/spotify.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit{
  constructor(private _spotify : SpotifyService){}

  ngOnInit(): void {
    if(!sessionStorage.getItem('topArtists')){
      this._spotify.getArtists().subscribe({
        next: (response: ServerResponse) => {
            sessionStorage.setItem('topArtists', JSON.stringify(response.data));
        },
        error: (err: ServerResponse) => {
          console.error(err);
        }
      })
    }
  }
}
