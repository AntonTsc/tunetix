import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';

interface Purchase {
  id: string;
  eventId?: string;
  eventName: string;
  location: string;
  purchaseDate: Date;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  status: 'completed' | 'pending' | 'canceled';
  paymentMethod?: {
    id: number;
    type: string;
    owner: string;
  };
}

@Component({
  selector: 'app-historial-compras',
  templateUrl: './historial-compras.component.html',
  styleUrls: ['./historial-compras.component.css']
})
export class HistorialComprasComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  filterOption: string = 'all';
  loading: boolean = true;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // For template use
  Math = Math;

  constructor(private router: Router, private ticketService: TicketService) { }

  ngOnInit(): void {
    this.loadPurchases();
  }

  // Cargar compras desde el servidor
  loadPurchases(): void {
    this.loading = true;
    this.error = null;

    this.ticketService.getUserTickets().subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          // Convertir las fechas de string a objetos Date
          this.purchases = response.data.map((ticket: any) => ({
            id: ticket.id,
            eventId: ticket.eventId,
            eventName: ticket.eventName,
            location: ticket.location,
            purchaseDate: new Date(ticket.purchaseDate),
            quantity: ticket.quantity,
            unitPrice: ticket.unitPrice,
            totalPrice: ticket.totalPrice,
            status: ticket.status,
            paymentMethod: ticket.paymentMethod
          }));

          // Inicializar filtered purchases
          this.applyFilter();
        } else {
          this.error = 'No se pudieron cargar las compras';
          this.purchases = [];
          this.filteredPurchases = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el historial de compras', err);
        this.error = 'Error al conectar con el servidor';
        this.loading = false;
        this.purchases = [];
        this.filteredPurchases = [];
      }
    });
  }

  // Apply filter based on selected option
  applyFilter(): void {
    const now = new Date();

    switch (this.filterOption) {
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        this.filteredPurchases = this.purchases.filter(p => p.purchaseDate >= thirtyDaysAgo);
        break;

      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        this.filteredPurchases = this.purchases.filter(p => p.purchaseDate >= startOfYear);
        break;

      default: // 'all'
        this.filteredPurchases = [...this.purchases];
    }

    // Reset pagination
    this.currentPage = 1;
  }

  // Get translated status text
  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Pendiente';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  // View purchase details - redirige a la página del evento si hay un eventId
  viewDetails(purchaseId: string): void {
    // Buscar el ticket en las compras
    const purchase = this.purchases.find(p => p.id === purchaseId);

    if (purchase && purchase.eventId) {
      // Si tiene un ID de evento, navegar a la página del evento (corregido a "evento" en singular)
      this.router.navigate(['/evento', purchase.eventId]);
    } else {
      // Si no tiene un ID de evento o no se encuentra la compra, usar la ruta antigua
      this.router.navigate(['/perfil/compras', purchaseId]);
    }
  }

  // Change page for pagination
  changePage(page: number): void {
    if (page < 1) return;
    if (page > Math.ceil(this.filteredPurchases.length / this.itemsPerPage)) return;
    this.currentPage = page;
  }

  // Generate page numbers for pagination
  pageNumbers(): number[] {
    const pageCount = Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
    return Array(pageCount).fill(0).map((_, i) => i + 1);
  }

  // Watch for filter changes
  onFilterChange(): void {
    this.applyFilter();
  }

  // Get only the items for the current page
  getCurrentPageItems(): Purchase[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredPurchases.length);
    return this.filteredPurchases.slice(startIndex, endIndex);
  }
}
