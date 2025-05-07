import { Location } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { LastfmService } from '../../services/lastfm.service';

interface Artist {
  name: string;
  mbid: string;
  url: string;
  image: Array<{
    '#text': string;
    size: string;
  }>;
  stats: {
    listeners: string;
    playcount: string;
  };
  tags?: {
    tag: Array<{
      name: string;
      url: string;
    }>;
  };
  bio?: {
    summary: string;
    content: string;
  };
  similar?: {
    artist: Array<{
      name: string;
      url: string;
      image: Array<{
        '#text': string;
        size: string;
      }>;
    }>;
  };
  concerts?: Array<{
    id: string;
    name: string;
    url: string;
    date: string;
    time: string;
    venue: {
      name: string;
      city: string;
      country: string;
    };
    images: Array<{
      url: string;
      ratio: string;
      width: number;
      height: number;
    }>;
    priceRanges?: Array<{
      type: string;
      min: number;
      max: number;
      currency: string;
    }>;
    image: string;
  }>;
}

@Component({
  selector: 'app-artista',
  templateUrl: './artista.component.html',
  styleUrls: ['./artista.component.css']
})
export class ArtistaComponent implements OnInit {
  artistId: string = '';
  artist: Artist | null = null;
  loading: boolean = true;
  error: string | null = null;
  showScrollButton = false;
  isBioExpanded = true;

  constructor(
    private route: ActivatedRoute,
    private lastfmService: LastfmService,
    private sanitizer: DomSanitizer,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
        const id = params['id'];
        if (id) {
            // Determinar si es un mbid (36 caracteres con guiones) o un nombre
            if (id.length === 36 && id.includes('-')) {
                this.lastfmService.getArtistMetadata(id, null).subscribe(this.handleResponse);
            } else {
                this.lastfmService.getArtistMetadata(null, id).subscribe(this.handleResponse);
            }
        }
    });
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

  private handleResponse = {
    next: (response: any) => {
        if (response.status === 'OK' && response.data) {
            this.artist = response.data;
        } else {
            this.error = response.message || 'Error al cargar la información del artista';
        }
        this.loading = false;
    },
    error: (error: any) => {
        this.error = 'No se pudo cargar la información del artista';
        this.loading = false;
        console.error('Error al obtener detalles del artista:', error);
    }
  };

  loadSimilarArtist(name: string): void {
    this.loading = true;
    this.error = null;

    const scrollPosition = window.scrollY;

    this.lastfmService.getArtistMetadata(null, name).subscribe({
        next: (response: any) => {
            if (response.status === 'OK' && response.data) {
                this.artist = response.data;
                // Actualizar la URL usando siempre el nombre del artista para consistencia
                this.location.go(`/artista/${this.artist?.name}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                this.error = response.message || 'Error al cargar la información del artista';
                window.scrollTo({ top: scrollPosition });
            }
            this.loading = false;
        },
        error: (error) => {
            this.error = 'No se pudo cargar la información del artista';
            this.loading = false;
            console.error('Error al obtener detalles del artista:', error);
            window.scrollTo({ top: scrollPosition });
        }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getMainImage(): string {
    if (this.artist?.image && this.artist.image.length > 0) {
      const mediumImage = this.artist.image.find(img => img.size === 'medium');
      return mediumImage ? mediumImage['#text'] : this.artist.image[0]['#text'];
    }
    return 'assets/images/default-artist.jpg';
  }

  getSimilarArtistImage(artist: any): string {
    if (artist.image && artist.image.length > 0) {
      const mediumImage = artist.image.find((img: any) => img.size === 'medium');
      return mediumImage ? mediumImage['#text'] : 'assets/images/default-artist.jpg';
    }
    return 'assets/images/default-artist.jpg';
  }

  getConcertImage(concert: any): string {
    if (concert.images && concert.images.length > 0) {
      // Find image with ratio 1:1 or return first image
      const squareImage = concert.images.find((img: { url: string; ratio: string; width: number; height: number; }) => img.ratio === '1_1') || concert.images[0];
      return squareImage.url;
    }
    return ''; // Fallback image
  }

  formatNumber(value: string | number): string {
    const num = typeof value === 'string' ? parseInt(value) : value;
    return new Intl.NumberFormat().format(num);
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleBio() {
    this.isBioExpanded = !this.isBioExpanded;
  }
}
