import { Component, OnInit } from '@angular/core';
import Artist from 'src/app/interfaces/Artist';
import Track from 'src/app/interfaces/Track';
import { ServerResponse } from 'src/app/interfaces/User';
import { ConcertsService } from 'src/app/services/concerts.service';
import { LastfmService } from 'src/app/services/lastfm.service';
import { TicketmasterService } from 'src/app/services/ticketmaster.service';

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
    private _lastfm: LastfmService,
    private _concerts: ConcertsService,
    private _ticketmaster: TicketmasterService
  ) {}

  ngOnInit(): void {
    // Cargar artistas top
    this._lastfm.getTopArtists(6, 1, "popularity_desc", "").subscribe({
      next: (response: any) => {
        if (response.status === 'OK' && response.data?.artists) {
          // Ya no filtramos por mbid, usamos todos los artistas
          this.artists = response.data.artists.map((artist: any) => ({
            ...artist,
            mbid: artist.mbid || null,
            name: artist.name
          }));
        }
        this.isLoadingArtists = false;
      },
      error: (error) => {
        console.error("Error fetching artists from Last.fm:", error);
        this.isLoadingArtists = false;
      }
    });

    // Cargar tracks top
    this._lastfm.getTopTracks(6, 1, "popularity_desc", "").subscribe({
      next: (response: any) => {
        this.tracks = response.data?.tracks || [];
        this.isLoadingTracks = false;
      },
      error: (error) => {
        console.error("Error fetching tracks from Last.fm:", error);
        this.isLoadingTracks = false;
      }
    });

    // Cargar conciertos
    this._ticketmaster.getConcerts(6, "", "ES").subscribe({
      next: (response: ServerResponse) => {
        if(response.status === "OK"){
          this.concerts = response.data || [];
          this.isLoadingConcerts = false;
        }else{
          console.error(response.message);
          this.isLoadingTracks = false;
        }
      },
      error: (error: any) => {
        console.error(error);
        this.isLoadingTracks = false;
      }
    })

    this._concerts.loading.subscribe(loading => {
      this.isLoadingConcerts = loading;
    });
  }
}