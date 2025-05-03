import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formattedText'
})
export class FormattedTextPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return '';
    
    // Eliminar etiquetas HTML si existen
    value = value.replace(/<[^>]*>/g, '');

    // Dividir por saltos de línea y limpiar espacios
    return value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n'); // Doble salto de línea para párrafos
  }
}
