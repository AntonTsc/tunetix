import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  serverResponse?: ServerResponse;
  showPassword: boolean = false;
  isLoading: boolean = false;
  isGoogleLoading: boolean = false; // Indicador separado para el botón de Google

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;

  constructor(
    private _auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar si hay un parámetro de retorno URL
    this.route.queryParams.subscribe(params => {
      const returnUrl = params['returnUrl'];
      if (returnUrl) {
        localStorage.setItem('returnUrl', returnUrl);
      }

      // Verificar si hay un mensaje de error de Google OAuth
      const error = params['error'];
      if (error) {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error en la autenticación con Google: ' + error,
          data: null
        };
      }

      // Verificar si hay un mensaje de éxito de Google OAuth
      const login = params['login'];
      if (login) {
        let message = 'Inicio de sesión exitoso';
        if (login === 'linked') {
          message = 'Cuenta vinculada con Google exitosamente';
        } else if (login === 'registered') {
          message = 'Registro con Google exitoso';
        }

        this.serverResponse = {
          status: 'OK',
          message,
          data: null
        };

        // Redirigir después de un breve retraso al inicio
        setTimeout(() => {
          this.router.navigateByUrl('/inicio');
        }, 1000);
      }
    });
  }

  login() {
    if (this.form.nativeElement.checkValidity()) {
      const email = this.form.nativeElement.querySelector<HTMLInputElement>('[name="email"]')?.value;
      const password = this.form.nativeElement.querySelector<HTMLInputElement>('[name="password"]')?.value;

      if (email && password) {
        this.isLoading = true;
        this._auth.login({
          email,
          password
        }).subscribe({
          next: (response) => {
            this.isLoading = false;
            this.serverResponse = response;

            if (response.status === 'OK') {
              // Redirigir al inicio
              this.router.navigateByUrl('/inicio');
            }
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error:', err);
            this.serverResponse = {
              status: 'ERROR',
              message: 'Error al conectar con el servidor',
              data: null
            };
          }
        });
      }
    } else {
      this.form.nativeElement.reportValidity();
    }
  }

  signInWithGoogle() {
    this.isGoogleLoading = true; // Usar el indicador específico para Google
    this.serverResponse = {
      status: 'INFO',
      message: 'Iniciando autenticación con Google...',
      data: null
    };

    // Usar el nuevo método simple de login con Google
    this._auth.googleLogin();
  }
}
