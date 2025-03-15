import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ArtistaComponent } from './components/artista/artista.component';
import { ArtistasComponent } from './components/artistas/artistas.component';
import { CancionesComponent } from './components/canciones/canciones.component';
import { EventoComponent } from './components/evento/evento.component';
import { EventosComponent } from './components/eventos/eventos.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { RegisterComponent } from './components/register/register.component';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { MetodosPagoComponent } from './components/metodos-pago/metodos-pago.component';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  {path: 'inicio', component: InicioComponent},
  {path: 'artistas', component: ArtistasComponent},
  {path: 'artista', component: ArtistaComponent},
  {path: 'canciones', component: CancionesComponent},
  {path: 'evento', component: EventoComponent},
  {path: 'eventos', component: EventosComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'perfil', component: PerfilComponent, canActivate:[authGuard], children:[
    {path: 'datos-personales', component: DatosPersonalesComponent},
    {path: 'metodos-de-pago', component: MetodosPagoComponent}
  ]},
  {path: '**', pathMatch: 'full', redirectTo: 'inicio'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
