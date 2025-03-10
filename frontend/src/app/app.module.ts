import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ArtistasComponent } from './components/artistas/artistas.component';
import { ArtistaComponent } from './components/artista/artista.component';
import { EventosComponent } from './components/eventos/eventos.component';
import { EventoComponent } from './components/evento/evento.component';
import { CancionesComponent } from './components/canciones/canciones.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { MetodosPagoComponent } from './components/metodos-pago/metodos-pago.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from './components/alert/alert.component';

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
    AlertComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
