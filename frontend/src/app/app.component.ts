import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private refreshInterval: any;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Para pruebas, refresca cada 5 segundos
    this.refreshInterval = setInterval(() => {
      console.log('Intentando refrescar access_token');
      this.authService.refreshAccessToken().subscribe({
        next: (res) => console.log('Respuesta refresh:', res),
        error: (err) => console.error('Error refresh:', err)
      });
    }, 30 * 60 * 1000); // Refresca cada 30 minutos (1800000 ms)
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
