import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { TicketmasterService } from '../../services/ticketmaster.service';

@Component({
  selector: 'app-evento',
  templateUrl: './evento.component.html',
  styleUrls: ['./evento.component.css'],
  providers: [DatePipe]
})
export class EventoComponent implements OnInit {
  eventId: string = '';
  event: any = null;
  loading: boolean = true;
  error: string | null = null;
  showMapModal: boolean = false;
  ticketQuantity: number = 1;
  maxTickets: number = 6; // Límite máximo de tickets por compra

  constructor(
    private route: ActivatedRoute,
    private ticketmasterService: TicketmasterService,
    private ticketService: TicketService,
    private http: HttpClient,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = params['id'];
      this.loadEventDetails();
    });
  }

  private loadEventDetails(): void {
    this.loading = true;
    this.ticketmasterService.getEventById(this.eventId)
      .subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.event = response.data;
          } else {
            this.error = response.message;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'No se pudo cargar la información del evento';
          this.loading = false;
          console.error('Error al obtener detalles del evento:', error);
        }
      });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';
    const date = new Date(dateStr);
    return this.datePipe.transform(date, 'dd/MM/yyyy') || 'Fecha no disponible';
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return 'Hora no disponible';
    // El formato de hora viene como "21:30:00", lo convertimos a formato más amigable
    const timeParts = timeStr.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  }

  getMainImage(): string {
    if (this.event?.images && this.event.images.length > 0) {
      // Intentamos encontrar la imagen con mejor resolución
      const bestImage = this.event.images.find((img: any) => img.ratio === '16_9' && img.width > 1000);
      return bestImage ? bestImage.url : this.event.images[0].url;
    }
    return 'assets/images/default-event.jpg';
  }

  getMinPrice(): string {
    if (!this.event?.priceRanges || this.event.priceRanges.length === 0) {
      return 'Precio no disponible';
    }
    return `${this.event.priceRanges[0].min}€`;
  }

  decreaseTickets(): void {
    if (this.ticketQuantity > 1) {
      this.ticketQuantity--;
    }
  }

  increaseTickets(): void {
    if (this.ticketQuantity < this.maxTickets) {
      this.ticketQuantity++;
    }
  }

  validateTicketQuantity(): void {
    if (this.ticketQuantity < 1) {
      this.ticketQuantity = 1;
    } else if (this.ticketQuantity > this.maxTickets) {
      this.ticketQuantity = this.maxTickets;
    }
  }

  calculateTotal(): string {
    if (!this.event?.priceRanges || this.event.priceRanges.length === 0) {
      return 'Precio no disponible';
    }
    return `${this.event.priceRanges[0].min * this.ticketQuantity}€`;
  }

  async buyTickets(): Promise<void> {
    if (!this.event?.priceRanges || this.event.priceRanges.length === 0) {
      alert('Lo sentimos, los precios no están disponibles en este momento');
      return;
    }

    const minPrice = Math.min(...this.event.priceRanges.map((price: any) => price.min));

    try {
      const response = await this.ticketService.buyTickets({
        cantidad: this.ticketQuantity,
        precio_individual: minPrice,
        precio_total: minPrice * this.ticketQuantity,
        ubicacion: this.event._embedded?.venues[0]?.name || 'No especificada',
        artista: this.event._embedded?.attractions[0]?.name || this.event.name
      }).toPromise();

      if (response.status === 'OK') {
        alert('¡Compra realizada con éxito!');
        // Aquí podrías redirigir al historial de compras
      } else {
        alert('Error al procesar la compra: ' + response.message);
      }
    } catch (error) {
      console.error('Error en la compra:', error);
      alert('Error al procesar la compra');
    }
  }

  // Add encodeURIComponent method
  encodeURIComponent(str: string): string {
    return encodeURIComponent(str);
  }

  getShareUrls() {
    const text = `¡Mira este evento! ${this.event.name}`;
    const url = window.location.href;

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };
  }

  showMap() {
    this.showMapModal = true;
  }

  closeMap() {
    this.showMapModal = false;
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}
