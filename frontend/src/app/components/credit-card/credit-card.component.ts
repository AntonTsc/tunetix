import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Card from 'src/app/interfaces/Card';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { CardService } from 'src/app/services/card.service';

@Component({
  selector: 'app-credit-card',
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.css']
})

export class CreditCardComponent implements OnInit{

constructor(private _card: CardService){}

@Input() card!: Card
@Input() index!: number
@Output() delete: EventEmitter<any> = new EventEmitter<any>();
@Output() serverResponseEmitter: EventEmitter<ServerResponse> = new EventEmitter<ServerResponse>();
panLastFour!: string

deleteCard(): void {
  this._card.delete(this.card.id ?? 0).subscribe({
    next: (response: ServerResponse) => {
      this.serverResponseEmitter.emit(response);
      this.delete.emit(this.index);
    },
    error: (err: ServerResponse) => {
      this.serverResponseEmitter.emit(err);
    }
  });
}

getCardTypeClass(type: string): string {
  switch (type) {
    case 'VISA':
      return 'bg-blue-600';
    case 'MASTERCARD':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

serverResponse(){
  this.serverResponseEmitter.emit();
}

ngOnInit(): void {
  this.panLastFour = this.card.pan.toString().slice(-4)
}
}
