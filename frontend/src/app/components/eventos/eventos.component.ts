import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { TicketmasterService } from 'src/app/services/ticketmaster.service';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css'],
  animations: [
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(50, [
            animate('300ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class EventosComponent implements OnInit, OnDestroy {
  events: any[] = [];
  isLoading = true;
  error: string | null = null;
  searchForm: FormGroup;
  countries = [
    { code: 'ES', name: 'España' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'GB', name: 'Reino Unido' },
    { code: 'FR', name: 'Francia' },
    { code: 'DE', name: 'Alemania' },
    { code: 'IT', name: 'Italia' },
    { code: '', name: 'Todos los países' }
  ];  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 24;
  totalPages: number = 0;
  totalEvents: number = 0;

  private formSubscription: Subscription | undefined;
  sortOptions = [
    { value: 'name_asc', label: 'Nombre (A-Z)' },
    { value: 'name_desc', label: 'Nombre (Z-A)' },
    { value: 'date_asc', label: 'Fecha (más reciente)' },
    { value: 'date_desc', label: 'Fecha (más antiguo)' }
  ];

  imageLoaded: boolean = false;
  favorites: Set<string> = new Set();

  constructor(
    private ticketmasterService: TicketmasterService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      country: ['ES'],
      sortBy: ['date_asc'] // Cambiado a date_asc por defecto para mostrar los más cercanos
    });
  }

  ngOnInit(): void {
    // Suscribirse a los cambios del formulario con debounce
    this.formSubscription = this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetPagination();
      this.loadEvents();
    });

    // Cargar eventos iniciales
    this.loadEvents();
  }

  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  resetPagination(): void {
    this.currentPage = 0;
  }

  loadEvents(): void {
    this.isLoading = true;
    this.error = null;
    let { keyword, country, sortBy } = this.searchForm.value;

    keyword = (keyword || '').trim();

    this.ticketmasterService.getConcerts(this.pageSize, keyword, country, this.currentPage, sortBy)
      .subscribe({
        next: (response) => {
          // Verificar si la respuesta es nula o indefinida
          if (!response) {
            this.handleEmptyResults('No se encontraron resultados para esta búsqueda.');
            return;
          }

          if (response.status === 'OK') {
            this.events = response.data;

            // Actualizar paginación
            if (response.page) {
              this.currentPage = parseInt(response.page.number);
              this.totalEvents = parseInt(response.page.totalElements);
              this.totalPages = parseInt(response.page.totalPages);
              this.pageSize = parseInt(response.page.size);
            }

            this.error = null;
          } else {
            if (response.message === 'No se encontraron conciertos.') {
              this.handleEmptyResults('No se encontraron eventos para esta búsqueda.');
            } else {
              this.error = response.message || 'Error al cargar eventos';
              this.handleEmptyResults(this.error || 'Error desconocido al cargar eventos');
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching events:', error);
          this.error = 'Ha ocurrido un error al cargar los eventos. Por favor, inténtalo de nuevo más tarde.';
          this.handleEmptyResults(this.error);
        }
      });
  }

  // Método auxiliar para manejar casos donde no hay resultados
  private handleEmptyResults(message: string): void {
    this.events = [];
    this.totalPages = 0;
    this.totalEvents = 0;
    this.error = null;
    this.isLoading = false;
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.loadEvents();
      this.scrollToTop();
    }
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage--;
      this.loadEvents();
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  getImageUrl(event: any): string {
    if (event.images && event.images.length > 0) {
      // Intentar encontrar una imagen de mejor calidad
      const betterImage = event.images.find((img: any) => img.ratio === '16_9' && img.width > 500);
      return betterImage ? betterImage.url : event.images[0].url;
    }
    // Usar la imagen predeterminada de Last.fm como respaldo
    return 'https://lastfm.freetls.fastly.net/i/u/64s/2a96cbd8b46e442fc41c2b86b821562f.png';
  }

  getEventDate(event: any): string {
    if (event.dates && event.dates.start && event.dates.start.localDate) {
      return event.dates.start.localDate;
    }
    return 'Fecha no disponible';
  }

  getEventLocation(event: any): string {
    if (event._embedded && event._embedded.venues && event._embedded.venues.length > 0) {
      const venue = event._embedded.venues[0];
      let location = venue.name || '';

      if (venue.city && venue.city.name) {
        location += location ? `, ${venue.city.name}` : venue.city.name;
      }

      if (venue.country && venue.country.name) {
        location += location ? `, ${venue.country.name}` : venue.country.name;
      }

      return location || 'Ubicación no disponible';
    }
    return 'Ubicación no disponible';
  }
  clearSearch(): void {
    this.searchForm.patchValue({
      keyword: ''
    });
    // Cargar eventos al limpiar la búsqueda
    this.resetPagination();
    this.loadEvents();
  }

  resetFilters(): void {
    this.searchForm.reset({
      keyword: '',
      country: 'ES',
      sortBy: 'date_asc'
    });
    this.resetPagination();
    this.loadEvents();
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  hasNextPage(): boolean {
    return this.events.length > 0 && this.currentPage < this.totalPages - 1;
  }

  toggleFavorite(event: any): void {
    const eventId = event.id;
    if (this.favorites.has(eventId)) {
      this.favorites.delete(eventId);
    } else {
      this.favorites.add(eventId);
    }
  }

  isFavorite(event: any): boolean {
    return this.favorites.has(event.id);
  }
}
