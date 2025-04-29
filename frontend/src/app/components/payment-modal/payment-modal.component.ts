import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Card from 'src/app/interfaces/Card';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { CardService } from 'src/app/services/card.service';

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

  // Form for adding a new card
  cardForm: FormGroup;
  months: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = [];

  constructor(
    private cardService: CardService,
    private fb: FormBuilder
  ) {
    // Initialize form
    this.cardForm = this.fb.group({
      cardOwner: ['', Validators.required],
      cardNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{16}$')
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
