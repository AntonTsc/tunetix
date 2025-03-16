import { Component, ElementRef, ViewChild } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  constructor(private _auth: AuthService){}

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;
  @ViewChild('repeatPassword') repeatPassword!: ElementRef<HTMLInputElement>;
  serverResponse?: ServerResponse;

  register(){
    const fd = new FormData(this.form.nativeElement);

    const json = {
      first_name: fd.get('first_name'),
      last_name: fd.get('last_name'),
      email: fd.get('email'),
      password: fd.get('password')
    }
    if(this.repeatPassword.nativeElement.value !== fd.get('password')){
      this.serverResponse = {status: 'ERROR', message: 'Las contraseñas no coinciden'}
      return;
    }
    if(fd.get('first_name') === '' || fd.get('last_name') === '' || fd.get('email') === '' || fd.get('password') === ''){
      this.serverResponse = {status: 'ERROR', message: 'Todos los campos deben ser rellenados'};
      return;
    }
    this._auth.register(json).subscribe({
      next: (data: ServerResponse) => {
        this.serverResponse = data;
      },
      error: (err) => {
        this.serverResponse = { status: 'ERROR', message: 'Error en el servidor' };
      }
    });
  }
}
