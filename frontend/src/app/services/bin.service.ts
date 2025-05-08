import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Servicio simplificado para detectar solo el tipo de tarjeta
 */
@Injectable({
  providedIn: 'root'
})
export class BinService {

  constructor() {}

  /**
   * Obtiene el tipo de tarjeta basado en su número
   * @param cardNumber Número de tarjeta
   * @returns Observable con el tipo de tarjeta (VISA, MASTERCARD, etc.)
   */
  getCardType(cardNumber: string): Observable<string | null> {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (cleanNumber.length < 6) {
      return of(null);
    }

    // VISA: Empieza con 4
    if (cleanNumber.startsWith('4')) {
      return of('VISA');
    }

    // MasterCard: Empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleanNumber) ||
        (/^2/.test(cleanNumber) && (parseInt(cleanNumber.substring(0, 4)) >= 2221 && parseInt(cleanNumber.substring(0, 4)) <= 2720))) {
      return of('MASTERCARD');
    }

    return of(null);
  }
}
