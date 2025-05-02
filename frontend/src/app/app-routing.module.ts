import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';

// Importar componentes
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { AdminMessagesComponent } from './components/admin/messages/messages.component';
import { AdminUsersComponent } from './components/admin/users/users.component';
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

const routes: Routes = [
  // Rutas públicas
  {path: 'inicio', component: InicioComponent},
  {path: 'artistas', component: ArtistasComponent},
  {path: 'artista', component: ArtistaComponent},
  {path: 'canciones', component: CancionesComponent},
  {path: 'evento/:id', component: EventoComponent},
  {path: 'eventos', component: EventosComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},

  // Rutas protegidas para usuarios autenticados
  {path: 'contacto', component: ContactoComponent, canActivate: [AuthGuard]},

  // Ruta principal de perfil con redirección automática a datos personales
  {path: 'perfil', redirectTo: 'perfil/datos-personales', pathMatch: 'full'},

  // Rutas anidadas de perfil
  {path: 'perfil', component: PerfilComponent, canActivate:[AuthGuard], children:[
    {path: 'datos-personales', component: DatosPersonalesComponent},
    {path: 'metodos-de-pago', component: MetodosPagoComponent},
    {path: 'historial-de-compras', component: HistorialComprasComponent}
  ]},

  // Rutas de administrador
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'messages', component: AdminMessagesComponent },
      { path: 'users', component: AdminUsersComponent }
    ]
  },

  {path: '**', pathMatch: 'full', redirectTo: 'inicio'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
