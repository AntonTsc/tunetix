import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent {
  @Input() data: any;
  @Input() loading: boolean = false;
  @Input() allowNoId: boolean = false; // Nueva propiedad

  getUrlImage(imageUrl?: string): string {
    if (imageUrl) {
      return imageUrl; // Si se proporciona una URL, se utiliza directamente
    }

    if ('image' in this.data && this.data.image.length > 0) {
      // Manejar la estructura de imágenes de Last.fm
      return this.data.image[3]?.['#text'];
    } else if ('images' in this.data && this.data.images.length > 0) {
      // Manejar la estructura de imágenes de Ticketmaster
      return this.data.images[0]?.url || '';
    }

    return ''; // Imagen por defecto
  }

  shouldShow(): boolean {
    if (this.allowNoId) return true;
    return this.data && (this.data.id || this.data.mbid);
  }
}
