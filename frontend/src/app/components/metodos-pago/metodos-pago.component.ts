import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import Card from 'src/app/interfaces/Card';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';
import { BinService } from 'src/app/services/bin.service';
import { CardService } from 'src/app/services/card.service';

// Función para aplicar el algoritmo de Luhn (mod 10)
function luhnCheck(cardNumber: string): boolean {
  // Eliminar espacios y caracteres no numéricos
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Recorrer la tarjeta de derecha a izquierda
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  // La tarjeta es válida si la suma es múltiplo de 10
  return (sum % 10) === 0;
}

// Validar el tipo de tarjeta según su prefijo y longitud
function getCardType(cardNumber: string): string | null {
  // Eliminar espacios
  const digits = cardNumber.replace(/\D/g, '');

  // VISA: Empieza con 4 y tiene 13 o 16 dígitos
  const visaRegex = /^4[0-9]{12}(?:[0-9]{3})?$/;

  // MasterCard: Empieza con 51-55 o 2221-2720 y tiene 16 dígitos
  const mastercardRegex = /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/;

  if (visaRegex.test(digits)) {
    return 'VISA';
  } else if (mastercardRegex.test(digits)) {
    return 'MASTERCARD';
  }

  return null;
}

// Custom validator function
function cardNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return { required: true };
  }

  const cardNumber = control.value.replace(/\s/g, '');

  // Verificar si son dígitos
  if (!/^\d+$/.test(cardNumber)) {
    return { invalidCardNumber: true };
  }

  // Verificar longitud básica
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return { invalidLength: true };
  }

  // Validar mediante algoritmo de Luhn
  if (!luhnCheck(cardNumber)) {
    return { invalidLuhn: true };
  }

  // Verificar el tipo de tarjeta
  const cardType = getCardType(cardNumber);
  if (!cardType) {
    return { invalidCardType: true };
  }

  return null;
}

// Función para formatear el número de tarjeta con espacios cada 4 dígitos
function formatCardNumber(value: string): string {
  if (!value) return '';
  // Limpiamos el valor de espacios y caracteres no numéricos
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

  // Limitamos a 16 dígitos máximo
  const digits = v.substring(0, 16);

  const parts = [];
  for (let i = 0, len = digits.length; i < len; i += 4) {
    parts.push(digits.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
}

@Component({
  selector: 'app-metodos-pago',
  templateUrl: './metodos-pago.component.html',
  styleUrls: ['./metodos-pago.component.css']
})
export class MetodosPagoComponent implements OnInit {
  serverResponse?: ServerResponse
  @ViewChild('form') form!: ElementRef<HTMLFormElement>;

  // Array of saved cards
  savedCards: Card[] = [];

  // Form for adding a new card
  cardForm: FormGroup;

  // Options for dropdown selects
  months: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = [];

  // Añadir userData para almacenar datos del usuario
  userData: any = null;

  isCardTypeDetected: boolean = false;

  // Lista completa de monedas disponibles
  currencies: {value: string, label: string}[] = [
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'USD', label: 'USD - Dólar estadounidense' },
    { value: 'GBP', label: 'GBP - Libra esterlina' },
    { value: 'ARS', label: 'ARS - Peso argentino' },
    { value: 'MXN', label: 'MXN - Peso mexicano' },
    { value: 'CLP', label: 'CLP - Peso chileno' },
    { value: 'COP', label: 'COP - Peso colombiano' },
    { value: 'BRL', label: 'BRL - Real brasileño' },
    { value: 'JPY', label: 'JPY - Yen japonés' },
    { value: 'CNY', label: 'CNY - Yuan chino' },
    { value: 'CAD', label: 'CAD - Dólar canadiense' },
    { value: 'AUD', label: 'AUD - Dólar australiano' }
  ];

  constructor(
    private fb: FormBuilder,
    private _card: CardService,
    private authService: AuthService,
    private binService: BinService
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [
        Validators.required,
        cardNumberValidator
      ]],
      cardOwner: ['', Validators.required],
      expMonth: ['', Validators.required],
      expYear: ['', Validators.required],
      cvc: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]],
      cardType: ['', Validators.required],
      currency: ['EUR', Validators.required]
    });

    // Generate years for the dropdown (current year + 10)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.years.push((currentYear + i).toString().substr(2));
    }

    // Escuchar cambios en el número de tarjeta para aplicar formato
    this.cardForm.get('cardNumber')?.valueChanges.subscribe(value => {
      if (value) {
        const formattedValue = formatCardNumber(value);
        // Solo actualizar si el valor formateado es diferente para evitar bucles
        if (formattedValue !== value) {
          this.cardForm.get('cardNumber')?.setValue(formattedValue, { emitEvent: false });
        }

        // Verificamos si hay suficientes dígitos para detectar el tipo de tarjeta
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 6) {
          // Utilizamos el servicio para obtener el tipo de tarjeta
          this.binService.getCardType(digits).subscribe(cardType => {
            if (cardType) {
              this.cardForm.get('cardType')?.setValue(cardType);
              this.isCardTypeDetected = true;
            } else {
              // Si no se detecta con el servicio, intentamos con nuestra lógica local
              const localCardType = getCardType(digits);
              if (localCardType) {
                this.cardForm.get('cardType')?.setValue(localCardType);
                this.isCardTypeDetected = true;
              } else {
                this.isCardTypeDetected = false;
                if (digits.length >= 13) {
                  this.cardForm.get('cardType')?.setValue('');
                }
              }
            }
          });
        } else {
          // Si no hay suficientes dígitos, resetear la detección
          this.isCardTypeDetected = false;
        }
      } else {
        // Si el campo está vacío, permitir la selección manual
        this.isCardTypeDetected = false;
      }
    });
  }

  getAll(){
    this._card.getAll().subscribe({
      next: (response: ServerResponse) => {
        this.savedCards = response.data as Card[]
        // console.log(this.savedCards)
      },
      error: (err: any) => {
        console.error(err)
      }
    })
  }

  getServerResponse(event: ServerResponse){
    this.serverResponse = event;
  }

  create(){
    if (!this.cardForm.valid) {
      // Marcar todos los campos como tocados para mostrar errores de validación
      Object.keys(this.cardForm.controls).forEach(key => {
        this.cardForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Verificar si tenemos datos de usuario
    if (!this.userData || !this.userData.email) {
      this.serverResponse = {
        status: 'ERROR',
        message: 'No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.'
      };
      return;
    }

    const formValue = this.cardForm.value;

    const json = {
      type: formValue.cardType,
      email: this.userData.email,
      owner: formValue.cardOwner,
      pan: formValue.cardNumber.replace(/\s/g, ""), // Quita todos los espacios del codigo PAN
      cvc: formValue.cvc,
      expiration_date: `${formValue.expMonth}/${formValue.expYear}`,
      currency: formValue.currency
    };

    this._card.create(json).subscribe({
      next: (response: ServerResponse) => {
        this.serverResponse = response;
        
        // Solo si la operación fue exitosa
        if (response.status === 'OK') {
          // Reset the form
          this.cardForm.reset();
        }

        this.getAll();
      },
      error: (error) => {
        console.error('Error al crear la tarjeta:', error);
        this.serverResponse = {
          status: 'ERROR',
          message: 'Ha ocurrido un error al guardar la tarjeta.'
        };
      }
    });
  }

  ngOnInit(): void {
    this.getAll();

    // Suscribirse a los datos del usuario
    this.authService.userData$.subscribe(userData => {
      this.userData = userData;
    });

    // Si no hay datos de usuario, intentar obtenerlos
    if (!this.userData) {
      this.authService.fetchCurrentUserData().subscribe();
    }
  }

  // Delete a card
  deleteCard(event: number): void {
    this.savedCards.splice(event, 1);
  }

}
