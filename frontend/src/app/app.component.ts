import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Inicializar el estado de admin al cargar la aplicación
    if (this.authService.isAuthenticated()) {
      this.authService.checkAndUpdateAdminStatus().subscribe(
        isAdmin => console.log("App inicializada con estado admin:", isAdmin)
      );
    }
  }
}
