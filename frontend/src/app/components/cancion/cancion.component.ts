import { Location } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Track from 'src/app/interfaces/Track';
import { ServerResponse } from 'src/app/interfaces/User';
import { LastfmService } from 'src/app/services/lastfm.service';
import Cancion from './Track';

@Component({
  selector: 'app-cancion',
  templateUrl: './cancion.component.html',
  styleUrls: ['./cancion.component.css']
})
export class CancionComponent implements OnInit {
  constructor(private _lastfm: LastfmService, private route: ActivatedRoute, private location: Location) {}

  track!: Cancion;
  loading: boolean = true;
  error: string | null = null;
  artistName!: string;
  trackName!: string;
  isBioExpanded = true;
  showScrollButton = false;

  ngOnInit(): void{
    this.route.params.subscribe(params => {
      this.artistName = params['artist'];
      this.trackName = params['track'];

      this._lastfm.getTrackInfo(this.trackName, this.artistName).subscribe((response: ServerResponse) => {
      this.track = response.data.track;
      this.loading = false;
    })
    });
  }

  goBack(): void {
    this.location.back();
  }

  getMainImage(item: any): string {
    if (item.image && item.image.length > 0) {
      const mediumImage = item.image.find((img: any) => img.size === 'extralarge');
      return mediumImage ? mediumImage['#text'] : item.image[0]['#text'];
    }
    return 'assets/images/default-artist.jpg';
  }

  toggleBio() {
    this.isBioExpanded = !this.isBioExpanded;
  }

  loadSimilarTracks(mbid: string){

  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
