import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { LastfmService } from 'src/app/services/lastfm.service';

interface Artist {
  name: string;
  playcount: string;
  listeners: string;
  url: string;
  image: Array<{
    '#text': string;
    size: string;
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

@Component({
  selector: 'app-artistas',
  templateUrl: './artistas.component.html',
  styleUrls: ['./artistas.component.css']
})
export class ArtistasComponent implements OnInit {
  artists: Artist[] = [];
  isLoading = true;
  error: string | null = null;
  searchForm: FormGroup;
  currentPage: number = 1;
  pageSize: number = 24;
  totalPages: number = 0;
  totalArtists: number = 0;
  favorites: Set<string> = new Set();

  private formSubscription: Subscription | undefined;

  sortOptions = [
    { value: 'name_asc', label: 'Nombre (A-Z)' },
    { value: 'name_desc', label: 'Nombre (Z-A)' },
    { value: 'popularity_asc', label: 'Menos populares primero' },
    { value: 'popularity_desc', label: 'Más populares primero' }
  ];

  constructor(
    private lastfmService: LastfmService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      sortBy: ['popularity_desc']
    });
  }

  ngOnInit(): void {
    // Suscribirse a los cambios en el formulario para aplicar filtros automáticamente
    this.formSubscription = this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetPagination();
      this.loadEvents();
    });

    // Cargar datos iniciales
    this.loadEvents();
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  loadEvents(): void {
    this.isLoading = true;
    this.error = null;

    // Obtener valores del formulario
    const { keyword, sortBy } = this.searchForm.value;

    this.lastfmService.getTopArtists(
      this.pageSize,
      this.currentPage,
      sortBy,
      keyword?.trim() || ''
    ).subscribe({
      next: (response: ServerResponse<{ artists: Artist[]; pagination: PaginationInfo }>) => {
        if (response.status === 'OK' && response.data) {
          const { artists, pagination } = response.data;

          // Actualizar el estado del componente
          this.artists = artists || [];
          this.currentPage = pagination.currentPage || this.currentPage; // Asegúrate de que currentPage se actualice correctamente
          this.totalPages = pagination.totalPages || 0;
          this.totalArtists = pagination.totalItems || 0;

          // Guardar en sessionStorage
          sessionStorage.setItem('artists', JSON.stringify(this.artists));
          sessionStorage.setItem('pagination', JSON.stringify(pagination));
        } else {
          this.handleError(response.message || 'Error al cargar artistas');
        }
      },
      error: (error) => {
        console.error('API Error:', error);
        this.handleError(
          error.error?.message || 'Ha ocurrido un error al cargar los artistas. Por favor, inténtalo de nuevo más tarde.'
        );
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private handleError(message: string): void {
    this.error = message;
    this.artists = [];
    this.totalPages = 0;
    this.totalArtists = 0;
    this.isLoading = false;

    // Limpiar sessionStorage en caso de error
    sessionStorage.removeItem('artists');
    sessionStorage.removeItem('pagination');
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.loadEvents();
    }
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage--;
      this.loadEvents();
    }
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1; // Verifica que no estés en la primera página
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages; // Verifica que no hayas alcanzado la última página
  }

  clearSearch(): void {
    this.searchForm.patchValue({
      keyword: ''
    });
    this.resetPagination();
    this.loadEvents();
  }

  toggleFavorite(artist: Artist): void {
    const artistId = artist.name; // Usa un identificador único, como el nombre del artista
    if (this.favorites.has(artistId)) {
      this.favorites.delete(artistId);
    } else {
      this.favorites.add(artistId);
    }
  }

  isFavorite(artist: Artist): boolean {
    return this.favorites.has(artist.name); // Verifica si el artista está en favoritos
  }
}
