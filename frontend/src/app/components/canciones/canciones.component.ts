import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { LastfmService } from 'src/app/services/lastfm.service';

interface Track {
  name: string;
  playcount: string;
  listeners: string;
  url: string;
  artist: {
    name: string;
    url: string;
  };
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
  selector: 'app-canciones',
  templateUrl: './canciones.component.html',
  styleUrls: ['./canciones.component.css']
})
export class CancionesComponent implements OnInit {
  tracks: Track[] = [];
  isLoading = true;
  error: string | null = null;
  searchForm: FormGroup;
  currentPage: number = 1;
  pageSize: number = 24;
  totalPages: number = 0;
  totalTracks: number = 0;
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
    this.formSubscription = this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetPagination();
      this.loadTracks();
    });

    this.loadTracks();
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  loadTracks(): void {
    this.isLoading = true;
    this.error = null;

    const { keyword, sortBy } = this.searchForm.value;

    this.lastfmService.getTopTracks(
      this.pageSize,
      this.currentPage,
      sortBy,
      keyword?.trim() || ''
    ).subscribe({
      next: (response: ServerResponse<{ tracks: Track[]; pagination: PaginationInfo }>) => {
        if (response.status === 'OK' && response.data) {
          const { tracks, pagination } = response.data;
          this.tracks = tracks || [];
          this.currentPage = pagination.currentPage || this.currentPage;
          this.totalPages = pagination.totalPages || 0;
          this.totalTracks = pagination.totalItems || 0;

          sessionStorage.setItem('tracks', JSON.stringify(this.tracks));
          sessionStorage.setItem('tracksPagination', JSON.stringify(pagination));
        } else {
          this.handleError(response.message || 'Error al cargar canciones');
        }
      },
      error: (error) => {
        console.error('API Error:', error);
        this.handleError(
          error.error?.message || 'Ha ocurrido un error al cargar las canciones. Por favor, inténtalo de nuevo más tarde.'
        );
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private handleError(message: string): void {
    this.error = message;
    this.tracks = [];
    this.totalPages = 0;
    this.totalTracks = 0;
    this.isLoading = false;

    sessionStorage.removeItem('tracks');
    sessionStorage.removeItem('tracksPagination');
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.loadTracks();
    }
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage--;
      this.loadTracks();
    }
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  clearSearch(): void {
    this.searchForm.patchValue({
      keyword: ''
    });
    this.resetPagination();
    this.loadTracks();
  }

  toggleFavorite(track: Track): void {
    const trackId = `${track.name}-${track.artist.name}`;
    if (this.favorites.has(trackId)) {
      this.favorites.delete(trackId);
    } else {
      this.favorites.add(trackId);
    }
  }

  isFavorite(track: Track): boolean {
    return this.favorites.has(`${track.name}-${track.artist.name}`);
  }
}
