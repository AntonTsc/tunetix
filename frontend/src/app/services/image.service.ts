import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageCache = new Map<string, string>();
  private apiBaseUrl = environment.apiUrl;
  // En lugar de una imagen física, usaremos una cadena especial como marcador
  public readonly SVG_FALLBACK = 'USE_SVG_FALLBACK';

  constructor(private http: HttpClient) { }

  /**
   * Determina si se debe mostrar el SVG en lugar de una imagen
   * @param imagePath Ruta de la imagen de perfil
   * @returns true si se debe mostrar el SVG, false si no
   */
  public shouldShowSvg(url: string | null): boolean {
    // Si no hay URL, está vacía, o está marcada como fallback en la caché
    return !url ||
           url === '' ||
           url === this.SVG_FALLBACK ||
           this.imageCache.get(url) === this.SVG_FALLBACK;
  }

  /**
   * Construye la URL completa para una imagen
   * @param imagePath Ruta relativa de la imagen
   * @returns URL completa de la imagen
   */
  getFullImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return '';
    }

    // Si ya es una URL completa, devolver tal cual
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Construir URL completa para imágenes en el backend
    return `${this.apiBaseUrl}/${imagePath}`;
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
   * @param element Elemento de imagen HTML que tuvo el error
   */
  handleImageError(element: HTMLImageElement): void {
    // Aplicar clase para ocultar la imagen con error
    element.classList.add('image-error');
    element.style.opacity = '0';

    // Registrar el error en consola para depuración
    console.warn('Error al cargar imagen:', element.src);

    // Guardar en caché que esta URL ha fallado y debe usar SVG
    this.imageCache.set(element.src, this.SVG_FALLBACK);

    // Eliminar el return ya que el método debe ser void
  }
}
