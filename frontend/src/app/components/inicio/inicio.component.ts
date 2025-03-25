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
      this._spotify.getArtists().subscribe({
        next: (data: any) => {
          console.log(data);
        },
        error: (err: any) => {
          console.error(err);
        }
      })
  }
}
