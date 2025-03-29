import { Component, Input } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent{
  @Input() serverResponse!: ServerResponse;
  statusStyleColors: Map<string, string> = new Map([
    ['OK', 'bg-green-50 border-green-500 text-green-700'],
    ['ERROR', 'bg-red-50 border-red-500 text-red-700']
  ])
}
