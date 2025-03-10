import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  isRouteAllowed: boolean = false;

  // El header no sera visible en las rutas /login y /register
  routes: string[] = ['/login', '/register'];

  constructor(private router: Router){
    this,router.events.subscribe(() => {
      this.isRouteAllowed = !this.routes.some(route => this.router.url.includes(route))
    })
  }
}
