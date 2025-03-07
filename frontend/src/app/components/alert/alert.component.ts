import { Component, Input, OnInit } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit{
  @Input() serverResponse!: ServerResponse;
  statusStyleColors: Map<string, string> = new Map([
    ['OK', 'text-green-800 bg-green-50 dark:bg-green-600'],
    ['ERROR', 'text-red-800 bg-red-50 dark:bg-red-600']
  ])

  ngOnInit(): void {
    console.log(this.serverResponse.status)
    console.log(this.statusStyleColors.get(this.serverResponse.status))
  }


}
