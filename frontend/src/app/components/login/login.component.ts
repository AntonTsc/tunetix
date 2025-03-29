import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

  constructor(
    private _auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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

          // ELIMINADO: No almacenar datos del usuario en localStorage
          // Use the defined method for login success
          this.onLoginSuccess(response);
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

  onLoginSuccess(response: any) {
    if (response.status === 'OK') {
      // Force role check from database
      this._auth.checkAndUpdateAdminStatus().subscribe(isAdmin => {
        console.log("Login completado, estado admin:", isAdmin);

        // Correctly access query parameters using ActivatedRoute
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inicio';
        this.router.navigateByUrl(returnUrl);
      });
    }
  }
}
