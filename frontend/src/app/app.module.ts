import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AlertComponent } from './components/alert/alert.component';
import { ArtistaComponent } from './components/artista/artista.component';
import { ArtistasComponent } from './components/artistas/artistas.component';
import { CancionesComponent } from './components/canciones/canciones.component';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { EventoComponent } from './components/evento/evento.component';
import { EventosComponent } from './components/eventos/eventos.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HistorialComprasComponent } from './components/historial-compras/historial-compras.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { MetodosPagoComponent } from './components/metodos-pago/metodos-pago.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { RegisterComponent } from './components/register/register.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CreditCardComponent } from './components/credit-card/credit-card.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { AdminMessagesComponent } from './components/admin/messages/messages.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ArtistasComponent,
    ArtistaComponent,
    EventosComponent,
    EventoComponent,
    CancionesComponent,
    InicioComponent,
    PerfilComponent,
    LoginComponent,
    RegisterComponent,
    DatosPersonalesComponent,
    MetodosPagoComponent,
    ClickOutsideDirective,
    AlertComponent,
    HistorialComprasComponent,
    CreditCardComponent,
    ContactoComponent,
    AdminMessagesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule
  ],
  // Se registra el interceptor para poder usarlo en todo el proyecto
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
