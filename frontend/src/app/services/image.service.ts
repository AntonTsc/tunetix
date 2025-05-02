import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageCache = new Map<string, string>();
  // En lugar de una imagen física, usaremos una cadena especial como marcador
  public readonly SVG_FALLBACK = 'USE_SVG_FALLBACK';

  constructor(private http: HttpClient) {}

  /**
   * Determina si se debe mostrar el SVG en lugar de una imagen
   */
  public shouldShowSvg(url: string | null): boolean {
    // Si no hay URL, está vacía, o está marcada como fallback en la caché
    return !url ||
           url === '' ||
           url === this.SVG_FALLBACK ||
           this.imageCache.get(url) === this.SVG_FALLBACK;
  }

  /**
   * Obtiene una imagen, usando caché si está disponible o manejando casos de error
   */
  getProfileImage(url: string | null): string {
    if (!url || url === '') return this.SVG_FALLBACK;

    // Si ya tenemos esta URL en caché, usarla
    if (this.imageCache.has(url)) {
      const cachedUrl = this.imageCache.get(url);
      // Si la URL en caché es nuestro marcador, devolver algo que no cargará una imagen
      return cachedUrl === this.SVG_FALLBACK ? 'data:,none' : cachedUrl || 'data:,none';
    }

    // Si es una URL de Google, intentar evitar problemas de tasa límite
    if (url.includes('googleusercontent.com')) {
      // Agregar parámetro para evitar caché del navegador, lo que puede ayudar con los 429
      const uniqueParam = `?_t=${new Date().getTime()}`;
      const googleUrl = url.includes('?') ? `${url}&_nocache=${uniqueParam}` : `${url}${uniqueParam}`;

      // Mantener la URL en caché
      this.imageCache.set(url, googleUrl);
      return googleUrl;
    }

    return url;
  }

  /**
   * Maneja errores de carga de imágenes
   */
  handleImageError(url: string): string {
    console.warn(`Error cargando imagen: ${url}`);

    // Guardar en caché que esta URL ha fallado y debe usar SVG
    this.imageCache.set(url, this.SVG_FALLBACK);

    // Devolver una URL que no cargará una imagen (para evitar bucles)
    return 'data:,none';
  }
}
