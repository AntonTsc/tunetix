import { animate, group, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';

interface MessageResponse {
  status: string;
  message: string;
  data: any[];
  pagination: {
    total: number;
    new_count: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  animations: [
    // Animación de entrada/salida del panel con escala
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(100%) scale(0.95)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0) scale(1)',
        opacity: 1
      })),
      transition(':enter', [
        group([
          animate('350ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0) scale(1)' })),
          animate('250ms ease-in', style({ opacity: 1 }))
        ])
      ]),
      transition(':leave', [
        group([
          animate('350ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(100%) scale(0.95)' })),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ])
    ]),

    // Animación para el fondo con zoom
    trigger('backdropFade', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition(':enter', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition(':leave', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ]),

    // Animación para contenido interno en cascada
    trigger('contentAnimation', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(60, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class MessagesComponent implements OnInit {
  messages: any[] = [];
  selectedMessage: any = {};
  isDetailOpen: boolean = false;
  animatingClose: boolean = false;
  newMessagesCount: number = 0;
  loading: boolean = true;
  error: string = '';
  currentPage: number = 1;
  messagesPerPage: number = 10;
  totalMessages: number = 0;
  totalPages: number = 1;
  statusFilter: string = '';
  isStatusDropdownOpen = false;
  responseText: string = '';
  respondLoading: boolean = false;

  // Para usar Math en el template
  Math = Math;

  @ViewChild('statusDropdown') statusDropdownRef!: ElementRef;

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadMessages();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.statusDropdownRef && !this.statusDropdownRef.nativeElement.contains(event.target)) {
      this.isStatusDropdownOpen = false;
    }
  }

  toggleStatusDropdown() {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  loadMessages(): void {
    this.loading = true;
    this.messageService.getMessagesWithParams(this.currentPage, this.messagesPerPage, this.statusFilter)
      .subscribe({
        next: (response: MessageResponse) => {
          this.messages = response.data;
          this.totalMessages = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.newMessagesCount = response.pagination.new_count || 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.error = 'No se pudieron cargar los mensajes. Inténtalo de nuevo más tarde.';
          this.loading = false;
        }
      });
  }

  countNewMessages(messages: any[]): number {
    return messages.filter(m => m.status === 'nuevo').length;
  }

  openDetail(message: any): void {
    this.selectedMessage = { ...message };
    this.isDetailOpen = true;
    this.animatingClose = false;

    // Si el mensaje estaba en estado 'nuevo', actualizarlo a 'leído'
    if (message.status === 'nuevo') {
      this.updateStatus(message.id, 'leído', false);
    }
  }

  closeDetail(): void {
    // Primero, actualiza el estado para permitir que se active la animación
    this.animatingClose = true;

    // Después de un tiempo que coincida con la duración de la animación,
    // realmente cambia isDetailOpen a false
    setTimeout(() => {
      this.isDetailOpen = false;
      this.animatingClose = false;
    }, 300); // Duración de la animación en ms
  }

  deleteMessage(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
      this.messageService.deleteMessage(id).subscribe({
        next: () => {
          // Eliminar mensaje de la lista local
          this.messages = this.messages.filter(m => m.id !== id);

          // Si el panel de detalle está abierto y muestra este mensaje, cerrarlo
          if (this.isDetailOpen && this.selectedMessage.id === id) {
            this.closeDetail();
          }

          // Actualizar contador de mensajes nuevos
          this.newMessagesCount = this.countNewMessages(this.messages);

          // Recargar los mensajes si la página actual podría estar vacía
          if (this.messages.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadMessages();
          }
        },
        error: (err) => {
          console.error('Error deleting message:', err);
          alert('No se pudo eliminar el mensaje. Inténtalo de nuevo más tarde.');
        }
      });
    }
  }

  updateStatus(id: number, status: string, reloadMessages: boolean = true): void {
    this.messageService.updateMessageStatus(id, status).subscribe({
      next: () => {
        // Actualizar la lista de mensajes
        if (reloadMessages) {
          this.loadMessages();
        } else {
          // Actualizar solo el mensaje en la lista local
          const index = this.messages.findIndex(m => m.id === id);
          if (index !== -1) {
            this.messages[index].status = status;
            // Actualizar contador de mensajes nuevos
            this.newMessagesCount = this.countNewMessages(this.messages);
          }
        }
      },
      error: (err) => {
        console.error('Error updating message status:', err);
      }
    });
  }

  respondToMessage(): void {
    if (!this.selectedMessage || !this.responseText.trim()) {
      return;
    }

    this.respondLoading = true;
    // this.messageService.respondMessage(this.selectedMessage.id, this.responseText)
    //   .subscribe({
    //     next: () => {
    //       this.updateStatus(this.selectedMessage.id, 'respondido');
    //       this.responseText = '';
    //       this.respondLoading = false;
    //       alert('Respuesta enviada correctamente');
    //     },
    //     error: (error) => {
    //       console.error('Error al enviar respuesta:', error);
    //       this.respondLoading = false;
    //       alert('Error al enviar la respuesta');
    //     }
    //   });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMessages();
    }
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadMessages();
  }

  clearFilter(): void {
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadMessages();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'nuevo':
        return 'bg-red-100 text-red-800';
      case 'leído':
        return 'bg-blue-100 text-blue-800';
      case 'respondido':
        return 'bg-purple-100 text-purple-800';
      case 'archivado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'nuevo':
        return 'Nuevo';
      case 'leído':
        return 'Leído';
      case 'respondido':
        return 'Respondido';
      case 'archivado':
        return 'Archivado';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
