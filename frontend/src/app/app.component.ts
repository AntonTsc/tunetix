import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import ServerResponse from './interfaces/ServerResponse';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{

  isRouteAllowed: boolean = false;

  // El header no sera visible en las rutas /login y /register
  routes: string[] = ['/login', '/register'];

  constructor(private _auth: AuthService, private router: Router){
    this,router.events.subscribe(() => {
      this.isRouteAllowed = !this.routes.some(route => this.router.url.includes(route))
    })
  }
  // Para paginas que requirean tener una sesion activa //
  //
  // validateToken(){
  //   this._auth.validateToken().subscribe({
  //     next: (response: ServerResponse) => {
  //       console.log(response);
        
  //       if(response.status === 'ERROR'){
  //         this.router.navigate(['/login']);
  //       }
  //     }
  //   });
  // }

  // ngAfterViewInit(): void {
  //   this.validateToken();
  // }
}
