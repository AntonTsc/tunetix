import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { CardService } from 'src/app/services/card.service';

// Custom validator function
function cardNumberValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Let the required validator handle empty values
  }

  // Remove all spaces and check length
  const cardNumberWithoutSpaces = control.value.replace(/\s/g, '');
  if (cardNumberWithoutSpaces.length !== 16) {
    return { 'invalidCardNumber': true };
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(cardNumberWithoutSpaces)) {
    return { 'invalidCardNumber': true };
  }

  return null; // Valid
}

interface Card {
  lastFour: string;
  expMonth: string;
  expYear: string;
  type: string;
  currency: string;
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

  constructor(private fb: FormBuilder, private _card: CardService) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [
        Validators.required,
        cardNumberValidator  // Apply the custom validator
      ]],
      cardOwner: ['', Validators.required],
      expMonth: ['', Validators.required],
      expYear: ['', Validators.required],
      cvc: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
      cardType: ['', Validators.required],
      currency: ['', Validators.required]
    });

    // Generate years for the dropdown (current year + 10)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.years.push((currentYear + i).toString().substr(2));
    }
  }

  getAll(){
    
  }

  create(){
    const fd = new FormData(this.form.nativeElement);

    const json = {
      type: fd.get('type'),
      email: JSON.parse(localStorage.getItem('user_data') ?? '').email,
      owner: fd.get('owner'),
      pan: fd.get('pan'),
      cvc: fd.get('cvc'),
      expiration_date: `${fd.get('expMonth')}/${fd.get('expYear')}`
    };

    this._card.create(json).subscribe({
      next: (response: ServerResponse) => {
        this.serverResponse = response;
        console.log(response)
      }
    })
  }

  ngOnInit(): void {
    // Sample saved card for demonstration
    this.savedCards = [
      {
        lastFour: '4242',
        expMonth: '12',
        expYear: '25',
        type: 'visa',
        currency: 'EUR'
      }
    ];
  }

  // Add a new card
  addCard(): void {
    if (this.cardForm.valid) {
      const formValue = this.cardForm.value;

      // Remove spaces from card number
      const cardNumberWithoutSpaces = formValue.cardNumber.replace(/\s/g, '');

      // Create new card object with last 4 digits
      const newCard: Card = {
        lastFour: cardNumberWithoutSpaces.slice(-4),
        expMonth: formValue.expMonth,
        expYear: formValue.expYear,
        type: formValue.cardType,
        currency: formValue.currency
      };

      // Add to saved cards
      this.savedCards.push(newCard);

      // Reset the form
      this.cardForm.reset();
    }
  }

  // Delete a card
  deleteCard(index: number): void {
    this.savedCards.splice(index, 1);
  }

  // Get CSS class for card type icon background
  getCardTypeClass(type: string): string {
    switch (type) {
      case 'visa':
        return 'bg-blue-600';
      case 'mastercard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }
}
