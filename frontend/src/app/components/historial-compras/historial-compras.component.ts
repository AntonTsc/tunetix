import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Purchase {
  id: string;
  eventName: string;
  eventImage: string;
  location: string;
  purchaseDate: Date;
  quantity: number;
  totalPrice: number;
  status: 'completed' | 'pending' | 'canceled';
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

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // For template use
  Math = Math;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Sample data - in a real app this would come from a service
    this.purchases = [
      {
        id: '1',
        eventName: 'Concierto de Imagine Dragons',
        eventImage: 'assets/imgs/events/imagine-dragons.jpg',
        location: 'Estadio Santiago Bernabéu, Madrid',
        purchaseDate: new Date(2024, 11, 15),
        quantity: 2,
        totalPrice: 150.00,
        status: 'completed'
      },
      {
        id: '2',
        eventName: 'Festival Primavera Sound',
        eventImage: 'assets/imgs/events/primavera-sound.jpg',
        location: 'Parc del Fòrum, Barcelona',
        purchaseDate: new Date(2024, 5, 22),
        quantity: 1,
        totalPrice: 90.50,
        status: 'completed'
      },
      {
        id: '3',
        eventName: 'Concierto de Rosalía',
        eventImage: 'assets/imgs/events/rosalia.jpg',
        location: 'WiZink Center, Madrid',
        purchaseDate: new Date(2024, 8, 5),
        quantity: 4,
        totalPrice: 280.00,
        status: 'pending'
      },
      {
        id: '4',
        eventName: 'Festival Mad Cool',
        eventImage: 'assets/imgs/events/mad-cool.jpg',
        location: 'Espacio Mad Cool, Madrid',
        purchaseDate: new Date(2023, 6, 12),
        quantity: 2,
        totalPrice: 180.00,
        status: 'completed'
      },
      {
        id: '5',
        eventName: 'Concierto de Dua Lipa',
        eventImage: 'assets/imgs/events/dua-lipa.jpg',
        location: 'Palau Sant Jordi, Barcelona',
        purchaseDate: new Date(2023, 9, 30),
        quantity: 3,
        totalPrice: 210.50,
        status: 'canceled'
      },
      {
        id: '6',
        eventName: 'Festival Sonorama Ribera',
        eventImage: 'assets/imgs/events/sonorama.jpg',
        location: 'Aranda de Duero, Burgos',
        purchaseDate: new Date(2023, 7, 10),
        quantity: 2,
        totalPrice: 120.00,
        status: 'completed'
      }
    ];

    // Initialize filtered purchases
    this.applyFilter();
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

  // View purchase details
  viewDetails(purchaseId: string): void {
    this.router.navigate(['/perfil/compras', purchaseId]);
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
