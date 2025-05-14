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

  // Nuevas propiedades para las estadísticas por sección
  artistStats: any = {
    total: 0,
    popular: []
  };

  eventStats: any = {
    total: 0,
    upcoming: 0,
    sold: 0
  };

  trackStats: any = {
    total: 0,
    popular: []
  };

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadMessageStats();
    this.loadSystemInfo();
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

  loadSystemInfo(): void {
    // Aquí se podría implementar una llamada a un servicio para obtener información del sistema
    // Por ahora, simplemente usaremos datos simulados
    this.systemInfo = {
      serverTime: new Date(),
      appVersion: '1.0.0',
      lastBackup: new Date(Date.now() - 86400000), // Ayer
      status: 'Operativo'
    };

    // Datos simulados para estadísticas
    this.artistStats = {
      total: 120,
      popular: ['Taylor Swift', 'Bad Bunny', 'Coldplay']
    };

    this.eventStats = {
      total: 45,
      upcoming: 12,
      sold: 840
    };

    this.trackStats = {
      total: 350,
      popular: ['Cruel Summer', 'As It Was', 'Flowers']
    };
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
    this.loadSystemInfo();
  }
}
