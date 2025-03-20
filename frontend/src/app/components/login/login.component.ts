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
  serverResponse?: ServerResponse;
  showPassword: boolean = false;

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;

  constructor(private _auth: AuthService, private router: Router) {}

  login() {
    const fd = new FormData(this.form.nativeElement);

    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    // Validar que los campos no estén vacíos
    if (!email || !password) {
      this.serverResponse = {
        status: 'ERROR',
        message: 'Todos los campos deben ser rellenados',
        data: null
      };
      return;
    }

    const json = { email, password };

    // Mostrar mensaje de carga
    this.serverResponse = {
      status: 'INFO',
      message: 'Verificando credenciales...',
      data: null
    };

    this._auth.login(json).subscribe({
      next: (response: ServerResponse) => {
        if (!response.data) {
          response.data = null;
        }

        if (response.status === 'OK') {
          this.serverResponse = response;
          localStorage.setItem('user_data', JSON.stringify(response.data));

          setTimeout(() => {
            this.router.navigate(['/inicio']);
          }, 500);
        } else {
          this.serverResponse = response;
        }
      },
      error: (err) => {
        console.error('Error en el login:', err);

        this.serverResponse = {
          status: 'ERROR',
          message: err.status === 401
            ? 'Correo electrónico o contraseña incorrectos'
            : 'Error en el servidor. Por favor, inténtalo más tarde.',
          data: null
        };
      }
    });
  }
}
