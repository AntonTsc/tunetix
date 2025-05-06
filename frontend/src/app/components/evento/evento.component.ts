import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CardService } from '../../services/card.service';
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
  basePrice: number = 40; // Precio base por defecto
  ticketQuantity: number = 1;
  maxTickets: number = 6; // Límite máximo de tickets por compra
  showPaymentModal: boolean = false;
  paymentError: string | null = null;
  isProcessingPayment: boolean = false; // Añadir propiedad para controlar el estado de carga global
  showSuccessNotification: boolean = false;
  successMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private ticketmasterService: TicketmasterService,
    private ticketService: TicketService,
    private http: HttpClient,
    private datePipe: DatePipe,
    private authService: AuthService,
    private cardService: CardService
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

            // Formatea el precio a 2 decimales en el momento en que lo recibes
            this.basePrice = parseFloat(this.event.precio);

            // También puedes formatear cualquier precio en las priceRanges
            if (this.event.priceRanges && this.event.priceRanges.length > 0) {
              this.event.priceRanges.forEach((range: any) => {
                if (range.min) range.min = parseFloat(range.min).toFixed(2);
                if (range.max) range.max = parseFloat(range.max).toFixed(2);
              });
            }
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
    return '';
  }

  getMinPrice(): string {
  if (!this.event?.priceRanges || this.event.priceRanges.length === 0) {
    return 'Precio no disponible';
  }
  // Formatea el precio mínimo a 2 decimales
  return `${parseFloat(this.event.priceRanges[0].min).toFixed(2)}€`;
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

  getPrice(): string {
  // Formatea el precio base a 2 decimales
  return `${this.basePrice.toFixed(2)}€`;
}

  calculateTotal(): string {
  // Formatea el precio total a 2 decimales
  return `${(this.basePrice * this.ticketQuantity).toFixed(2)}€`;
}

  buyTickets(): void {
    if (this.event.dates?.status?.code === 'cancelled') {
      alert('Este evento ha sido cancelado y no se pueden vender entradas.');
      return;
    }

    // Mostrar el modal de pago en lugar de realizar la compra directamente
    this.showPaymentModal = true;
  }

  // Añadir nuevos métodos para manejar el modal
  handlePaymentCancel(): void {
    this.showPaymentModal = false;
    this.paymentError = null;
    this.isProcessingPayment = false; // Añadir método para resetear el estado cuando se cierra el modal
  }

  // Manejar la confirmación de pago
  async handlePaymentConfirm(paymentData: {cardId: number | null, newCard: any | null}): Promise<void> {
    try {
      this.isProcessingPayment = true;
      let paymentMethodId: number | null = paymentData.cardId;

      // Si es una tarjeta nueva, primero la guardamos
      if (paymentData.newCard) {
        // Usar firstValueFrom en lugar de toPromise (que está obsoleto)
        const result: any = await new Promise((resolve, reject) => {
          this.cardService.create(paymentData.newCard).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });
        });

        console.log('Respuesta de creación de tarjeta:', result);

        if (result.status === 'OK') {
          // Verificar la estructura de la respuesta
          if (result.data && result.data.id) {
            paymentMethodId = result.data.id; // ID en data.id
          } else if (result.id) {
            paymentMethodId = result.id; // ID directamente en la respuesta
          } else {
            // Si no se encuentra el ID, intentar obtener la tarjeta recién creada
            const cardsResult: any = await new Promise((resolve, reject) => {
              this.cardService.getAll().subscribe({
                next: (res) => resolve(res),
                error: (err) => reject(err)
              });
            });

            if (cardsResult.status === 'OK' && cardsResult.data && cardsResult.data.length > 0) {
              // Tomar la tarjeta más reciente (asumimos que es la que acabamos de crear)
              paymentMethodId = cardsResult.data[0].id;
            } else {
              throw new Error('No se pudo identificar el ID de la tarjeta creada');
            }
          }
        } else {
          this.paymentError = 'Error al registrar la tarjeta: ' + result.message;
          this.isProcessingPayment = false;
          return;
        }
      }

      if (!paymentMethodId) {
        this.paymentError = 'No se pudo obtener un método de pago válido';
        this.isProcessingPayment = false;
        return;
      }

      console.log('Usando método de pago con ID:', paymentMethodId);

      // Añadir un delay adicional para simular el procesamiento del pago
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Realizar la compra con el ID del método de pago
      const response: any = await new Promise((resolve, reject) => {
        this.ticketService.buyTickets({
          cantidad: this.ticketQuantity,
          precio_individual: this.basePrice,
          precio_total: this.basePrice * this.ticketQuantity,
          ubicacion: this.event._embedded?.venues[0]?.name || 'No especificada',
          artista: this.event._embedded?.attractions[0]?.name || this.event.name,
          metodo_pago_id: paymentMethodId,
          event_id: this.eventId // Añadido: guardar el ID del evento
        }).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(err)
        });
      });

      // Añadir delay antes de mostrar la confirmación
      await new Promise(resolve => setTimeout(resolve, 500));

      if (response.status === 'OK') {
        console.log('Compra realizada:', response);

        this.showPaymentModal = false;
        this.isProcessingPayment = false;

        // Mostrar notificación de éxito sin redirección automática
        this.successMessage = '¡Compra realizada con éxito!';
        this.showSuccessNotification = true;
      } else {
        this.paymentError = 'Error al procesar la compra: ' + response.message;
        this.isProcessingPayment = false;
      }
    } catch (error) {
      console.error('Error en la compra:', error);
      this.paymentError = 'Error al procesar la compra: ' + (error instanceof Error ? error.message : 'Error desconocido');
      this.isProcessingPayment = false;
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

  // Añadir método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  // Añadir método para navegar a la página de login
  navigateToLogin(): void {
    // Almacena la URL actual para redirigir después del login
    const currentUrl = window.location.href;
    localStorage.setItem('redirectUrl', currentUrl);

    // Navega a la página de login
    window.location.href = '/login';
  }

  // Modificar el método existente para que simplemente cierre la notificación
  closeSuccessNotification(): void {
    this.showSuccessNotification = false;
  }

  // Añadir un nuevo método para ver el historial de compras
  viewPurchaseHistory(): void {
    this.showSuccessNotification = false;
    window.location.href = '/perfil/historial-de-compras';
  }
}
