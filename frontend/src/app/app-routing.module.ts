import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MessagesComponent } from './components/admin/messages/messages.component';
import { ArtistaComponent } from './components/artista/artista.component';
import { ArtistasComponent } from './components/artistas/artistas.component';
import { CancionesComponent } from './components/canciones/canciones.component';
import { ContactoComponent } from './components/contacto/contacto.component';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { EventoComponent } from './components/evento/evento.component';
import { EventosComponent } from './components/eventos/eventos.component';
import { HistorialComprasComponent } from './components/historial-compras/historial-compras.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { MetodosPagoComponent } from './components/metodos-pago/metodos-pago.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {path: 'inicio', component: InicioComponent},
  {path: 'artistas', component: ArtistasComponent},
  {path: 'artista', component: ArtistaComponent},
  {path: 'canciones', component: CancionesComponent},
  {path: 'evento', component: EventoComponent},
  {path: 'eventos', component: EventosComponent},
  {path: 'contacto', component: ContactoComponent, canActivate: [AuthGuard]},
  {path: 'admin/messages', component: MessagesComponent, canActivate: [AuthGuard]
    // , data: { roles: ['admin'] }
  },
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'perfil', component: PerfilComponent, canActivate:[AuthGuard], children:[
    {path: 'datos-personales', component: DatosPersonalesComponent},
    {path: 'metodos-de-pago', component: MetodosPagoComponent},
    {path: 'historial-de-compras', component: HistorialComprasComponent}
  ]},
  {path: '**', pathMatch: 'full', redirectTo: 'inicio'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
