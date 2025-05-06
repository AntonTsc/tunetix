import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import Card from 'src/app/interfaces/Card';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { CardService } from 'src/app/services/card.service';

// Función para aplicar el algoritmo de Luhn (mod 10)
function luhnCheck(cardNumber: string): boolean {
  // Eliminar espacios y caracteres no numéricos
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 16) {
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
  if (cardNumber.length < 13 || cardNumber.length > 16) {
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
  selector: 'app-payment-modal',
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() eventInfo: any;
  @Input() quantity: number = 1;
  @Input() price: number = 0;
  @Input() isProcessing: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{cardId: number | null, newCard: any | null}>();

  savedCards: Card[] = [];
  loading: boolean = true;
  showNewCardForm: boolean = false;
  selectedCardId: number | null = null;
  formError: string | null = null;
  isCardTypeDetected: boolean = false;

  // Form for adding a new card
  cardForm: FormGroup;
  months: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = [];

  constructor(
    private cardService: CardService,
    private fb: FormBuilder
  ) {
    // Initialize form with improved validation
    this.cardForm = this.fb.group({
      cardOwner: ['', Validators.required],
      cardNumber: ['', [
        Validators.required,
        cardNumberValidator
      ]],
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

    // Escuchar cambios en el número de tarjeta para aplicar formato y autodetectar tipo
    this.cardForm.get('cardNumber')?.valueChanges.subscribe(value => {
      if (value) {
        const formattedValue = formatCardNumber(value);
        // Solo actualizar si el valor formateado es diferente para evitar bucles
        if (formattedValue !== value) {
          this.cardForm.get('cardNumber')?.setValue(formattedValue, { emitEvent: false });
        }

        // Auto-detectar tipo de tarjeta
        const cardType = getCardType(value.replace(/\s/g, ''));
        if (cardType) {
          this.cardForm.get('cardType')?.setValue(cardType);
          this.isCardTypeDetected = true; // Activar bloqueo del campo
        } else {
          this.isCardTypeDetected = false; // Desactivar bloqueo si no se reconoce el tipo
          if (value.replace(/\s/g, '').length >= 13) {
            // Si tiene al menos 13 dígitos pero no es un tipo válido, resetear el campo
            this.cardForm.get('cardType')?.setValue('');
          }
        }
      } else {
        // Si el campo está vacío, permitir la selección manual
        this.isCardTypeDetected = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedCards();
  }

  loadSavedCards(): void {
    this.loading = true;
    this.cardService.getAll().subscribe({
      next: (response: ServerResponse) => {
        if (response.status === 'OK' && response.data) {
          this.savedCards = response.data;
          this.loading = false;

          // Auto-select first card if available
          if (this.savedCards.length > 0) {
            this.selectedCardId = this.savedCards[0].id !== undefined ? this.savedCards[0].id : null;
          } else {
            // Show new card form if no cards available
            this.showNewCardForm = true;
          }
        } else {
          this.loading = false;
          this.showNewCardForm = true;
        }
      },
      error: () => {
        this.loading = false;
        this.showNewCardForm = true;
      }
    });
  }

  toggleNewCardForm(): void {
    this.showNewCardForm = !this.showNewCardForm;
    if (this.showNewCardForm) {
      this.selectedCardId = null;
    }
  }

  selectCard(cardId: number): void {
    this.selectedCardId = cardId;
    this.showNewCardForm = false;
  }

  closeModal(): void {
    this.close.emit();
    // Reset form state
    this.selectedCardId = this.savedCards.length > 0 ?
      (this.savedCards[0].id !== undefined ? this.savedCards[0].id : null) : null;
    this.showNewCardForm = this.savedCards.length === 0;
    this.cardForm.reset({currency: 'EUR'});
    this.formError = null;
  }

  confirmPayment(): void {
    if (this.isProcessing) return;

    this.formError = null;

    if (this.showNewCardForm) {
      // Process with new card
      if (this.cardForm.invalid) {
        // Marcar todos los campos como tocados para mostrar errores
        Object.keys(this.cardForm.controls).forEach(key => {
          this.cardForm.get(key)?.markAsTouched();
        });
        this.formError = 'Por favor, complete correctamente todos los campos';
        return;
      }

      const formData = this.cardForm.value;
      const newCard = {
        tipo: formData.cardType,
        titular: formData.cardOwner,
        pan: formData.cardNumber.replace(/\s/g, ''),
        cvc: formData.cvc,
        fecha_expiracion: `${formData.expMonth}/${formData.expYear}`,
        divisa: formData.currency
      };

      this.confirm.emit({ cardId: null, newCard: newCard });
    } else {
      // Process with existing card
      if (!this.selectedCardId) {
        this.formError = 'Por favor, seleccione una tarjeta para continuar';
        return;
      }

      this.confirm.emit({ cardId: this.selectedCardId, newCard: null });
    }
  }

  // Helper for displaying masked card number
  getMaskedCardNumber(pan: number): string {
    const panStr = pan.toString();
    return `**** **** **** ${panStr.slice(-4)}`;
  }

  getCardIcon(type: string): string {
    return type === 'VISA' ? 'fa-cc-visa' : 'fa-cc-mastercard';
  }

  getCardIconColor(type: string): string {
    return type === 'VISA' ? 'text-blue-600' : 'text-red-500';
  }
}
