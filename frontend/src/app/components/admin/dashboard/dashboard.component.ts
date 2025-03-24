import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  statsLoading = false;
  messageStats: any = {};
  error: string = '';

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadMessageStats();
  }

  loadMessageStats(): void {
    this.statsLoading = true;
    this.messageService.getMessageStats().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.messageStats = response.data;
        } else {
          this.error = response.message || 'Error al cargar estadísticas';
        }
        this.statsLoading = false;
      },
      error: (err) => {
        this.error = 'Error al conectar con el servidor';
        this.statsLoading = false;
        console.error('Error cargando estadísticas:', err);
      }
    });
  }
}
