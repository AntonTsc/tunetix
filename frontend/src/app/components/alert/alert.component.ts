<<<<<<< HEAD
import { Component, Input, OnInit } from '@angular/core';
=======
import { Component, Input } from '@angular/core';
>>>>>>> 1146de4923edd74e91bd9f73d69b5ab024695083
import ServerResponse from 'src/app/interfaces/ServerResponse';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
<<<<<<< HEAD
export class AlertComponent implements OnInit{
=======
export class AlertComponent{
>>>>>>> 1146de4923edd74e91bd9f73d69b5ab024695083
  @Input() serverResponse!: ServerResponse;
  statusStyleColors: Map<string, string> = new Map([
    ['OK', 'text-green-800 bg-green-50 dark:bg-green-600'],
    ['ERROR', 'text-red-800 bg-red-50 dark:bg-red-600']
  ])
<<<<<<< HEAD

  ngOnInit(): void {
    console.log(this.serverResponse.status)
    console.log(this.statusStyleColors.get(this.serverResponse.status))
  }


=======
>>>>>>> 1146de4923edd74e91bd9f73d69b5ab024695083
}
