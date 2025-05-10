import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { AdminMessagesComponent } from './components/admin/messages/messages.component';
import { AdminUsersComponent } from './components/admin/users/users.component';
import { AlertComponent } from './components/alert/alert.component';
import { ArtistaComponent } from './components/artista/artista.component';
import { ArtistasComponent } from './components/artistas/artistas.component';
import { CancionesComponent } from './components/canciones/canciones.component';
import { CardComponent } from './components/card/card.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { CreditCardComponent } from './components/credit-card/credit-card.component';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { EventoComponent } from './components/evento/evento.component';
import { EventosComponent } from './components/eventos/eventos.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HistorialComprasComponent } from './components/historial-compras/historial-compras.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { MapModalComponent } from './components/map-modal/map-modal.component';
import { MetodosPagoComponent } from './components/metodos-pago/metodos-pago.component';
import { PaymentModalComponent } from './components/payment-modal/payment-modal.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { RegisterComponent } from './components/register/register.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { TooltipDirective } from './directives/tooltip.directive';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { TicketService } from './services/ticket.service';
import { TokenService } from './services/token.service';
import { FormattedTextPipe } from './pipes/formatted-text.pipe';
import { CancionComponent } from './components/cancion/cancion.component';

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
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminDashboardComponent,
    AdminUsersComponent,
    TooltipDirective,
    CardComponent,
    MapModalComponent,
    PaymentModalComponent,
    FormattedTextPipe,
    CancionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  // Se registra el interceptor para poder usarlo en todo el proyecto
  providers: [
    TokenService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    TicketService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
