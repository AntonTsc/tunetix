import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import Card from 'src/app/interfaces/Card';
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
    if (!this.cardForm.valid) {
      // Marcar todos los campos como tocados para mostrar errores de validación
      Object.keys(this.cardForm.controls).forEach(key => {
        this.cardForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.cardForm.value;

    const json = {
      type: formValue.cardType,
      email: JSON.parse(localStorage.getItem('user_data') ?? '').email,
      owner: formValue.cardOwner,
      pan: formValue.cardNumber.replace(/\s/g, ""), // Quita todos los espacios del codigo PAN
      cvc: formValue.cvc,
      expiration_date: `${formValue.expMonth}/${formValue.expYear}`,
      currency: formValue.currency
    };

    this._card.create(json).subscribe({
      next: (response: ServerResponse) => {
        this.serverResponse = response;
        console.log(response);

        // Solo si la operación fue exitosa
        if (response.status === 'OK') {
          // Reset the form
          this.cardForm.reset();

          // Inicializar valores por defecto después del reset si es necesario
          // this.cardForm.patchValue({
          //   cardType: 'VISA',
          //   currency: 'EUR'
          // });
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
  }

  // Delete a card
  deleteCard(event: number): void {
    this.savedCards.splice(event, 1);
  }

}
