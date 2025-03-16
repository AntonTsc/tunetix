import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  serverResponse!: ServerResponse;
  @ViewChild('form') form!: ElementRef<HTMLFormElement>;

  constructor(private _auth: AuthService, private router: Router) {}

  login(){
    const fd = new FormData(this.form.nativeElement);

    const json = {
      email: fd.get('email'),
      password: fd.get('password')
    }

    if(!fd.get('email') || !fd.get('password')){
      this.serverResponse = {status: 'ERROR', message: 'Todos los campos deben ser rellenados'};
      return;
    }

    this._auth.login(json).subscribe({
      next: (response: ServerResponse) => {
        // Verificar si la respuesta es exitosa antes de redirigir
        if (response.status === 'OK') {
          localStorage.setItem('user_data', JSON.stringify(response.data));
          this.router.navigate(['/inicio']);
        } else {
          // Si hay un error en la respuesta, mostrar el mensaje
          this.serverResponse = response;
        }
      },
      error: (err) => {
        // Si es un error HTTP, intentamos extraer el mensaje del servidor
        if (err.error && err.error.message) {
          this.serverResponse = {status: 'ERROR', message: err.error.message};
        } else {
          this.serverResponse = {status: 'ERROR', message: 'Error en el servidor'};
        }
        console.error('Error en el login:', err);
      }
    })
  }
}
