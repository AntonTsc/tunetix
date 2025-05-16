export interface Artist {
  mbid: string;
  name: string;
  playcount: string;
  listeners: string;
  url: string;
  image: Array<{
    '#text': string;
    size: string;
  }>;
  stats?: {
    listeners: string;
    playcount: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}