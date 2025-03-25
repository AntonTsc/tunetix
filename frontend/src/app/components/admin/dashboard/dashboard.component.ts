import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  statsLoading = false;
  messageStats: any = {
    general: {
      total: 0,
      unread: 0,
      latest: null
    },
    byStatus: {
      nuevo: 0,
      leído: 0,
      respondido: 0,
      archivado: 0
    },
    latestMessage: null
  };
  error: string = '';
  systemInfo: any = {
    serverTime: new Date(),
    appVersion: '1.0.0'
  };

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadMessageStats();
  }

  loadMessageStats(): void {
    this.statsLoading = true;
    this.error = '';

    this.messageService.getMessageStats().subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.messageStats = response.data;
        } else {
          this.error = response.message || 'Error al cargar estadísticas';
        }

        this.statsLoading = false;
        this.updateSystemInfo();
      },
      error: (err) => {
        this.error = 'Error al conectar con el servidor';
        this.statsLoading = false;
        console.error('Error cargando estadísticas:', err);
      }
    });
  }

  updateSystemInfo(): void {
    // Actualizar la hora del servidor
    this.systemInfo.serverTime = new Date();
  }

  // Método para formatear fechas
  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'No disponible';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  // Método para refrescar los datos
  refreshData(): void {
    this.loadMessageStats();
  }
}
