import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import Card from 'src/app/interfaces/Card';
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
      cvc: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]],
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
    this._card.getAll().subscribe({
      next: (response: ServerResponse) => {
        this.savedCards = response.data as Card[]
        console.log(this.savedCards)
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
    const formValue = this.cardForm.value;

    const json = {
      type: formValue.cardType,
      email: JSON.parse(localStorage.getItem('user_data') ?? '').email,
      owner: formValue.cardOwner,
      pan: formValue.cardNumber,
      cvc: formValue.cvc,
      expiration_date: `${formValue.expMonth}/${formValue.expYear}`,
      currency: formValue.currency
    };

    this._card.create(json).subscribe({
      next: (response: ServerResponse) => {
        this.serverResponse = response;
        console.log(response)
        this.getAll();
      }
    })
  }

  ngOnInit(): void {
    this.getAll();
    // Sample saved card for demonstration
    // this.savedCards = [
    //   {
    //     lastFour: '4242',
    //     expMonth: '12',
    //     expYear: '25',
    //     type: 'visa',
    //     currency: 'EUR'
    //   }
    // ];
  }

  // Add a new card
  addCard(): void {
    if (this.cardForm.valid) {
      const formValue = this.cardForm.value;

      // Remove spaces from card number
      const cardNumberWithoutSpaces = formValue.cardNumber.replace(/\s/g, '');

      // Create new card object with last 4 digits
      const newCard: Card = {

        pan: cardNumberWithoutSpaces.slice(-4),
        fecha_expiracion: `${formValue.expMonth}/${formValue.expYear}`,
        tipo: formValue.cardType,
        divisa: formValue.currency
      };

      // Add to saved cards
      this.savedCards.push(newCard);

      // Reset the form
      this.cardForm.reset();
    }
  }

  // Delete a card
  deleteCard(event: number): void {
    this.savedCards.splice(event, 1);
  }

}
