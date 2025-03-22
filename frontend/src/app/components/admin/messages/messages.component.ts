import { animate, group, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MessageResponse, MessageService } from 'src/app/services/message.service';

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

  // Nuevas propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalClosing: boolean = false;
  confirmAction: 'archive' | 'delete' = 'delete';
  selectedConfirmMessage: any = null;

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
          console.log('Mensajes cargados:', response);
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

  // Modificar el método openDetail para que no marque como leído automáticamente
  openDetail(message: any): void {
    this.selectedMessage = message;
    this.isDetailOpen = true;
    this.animatingClose = false;

    // Comentamos o eliminamos esta parte para que no marque como leído automáticamente
    // if (message.status === 'nuevo') {
    //   this.updateStatus(message.id, 'leído');
    //   message.status = 'leído';
    // }

    // Bloquear el scroll del cuerpo cuando se abre el panel
    document.body.style.overflow = 'hidden';
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

  // Método para mostrar el modal de confirmación de archivo
  showArchiveConfirm(message: any): void {
    this.selectedConfirmMessage = message;
    this.confirmAction = 'archive';
    this.showConfirmModal = true;
    this.confirmModalClosing = false;
  }

  // Método para mostrar el modal de confirmación de eliminación
  showDeleteConfirm(message: any): void {
    this.selectedConfirmMessage = message;
    this.confirmAction = 'delete';
    this.showConfirmModal = true;
    this.confirmModalClosing = false;
  }

  // Método para cancelar la acción de confirmación
  cancelConfirmModal(): void {
    this.confirmModalClosing = true;
    setTimeout(() => {
      this.showConfirmModal = false;
      this.selectedConfirmMessage = null;
    }, 300); // Tiempo de la animación
  }

  // Método para ejecutar la acción confirmada
  confirmActionExecute(): void {
    const messageId = this.selectedConfirmMessage.id;

    if (this.confirmAction === 'archive') {
      this.updateStatus(messageId, 'archivado');
    } else if (this.confirmAction === 'delete') {
      this.deleteMessage(messageId);
    }

    // Cerrar el modal
    this.cancelConfirmModal();
  }

  // Modificamos el método deleteMessage para que no use confirm() nativo
  deleteMessage(id: number): void {
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

  // Actualizar el método updateStatus para manejar correctamente los mensajes archivados
  updateStatus(id: number, status: string): void {
    this.messageService.updateMessageStatus(id, status).subscribe({
      next: () => {
        // Caso 1: Si estamos desarchivando un mensaje mientras filtramos por archivados
        if (status !== 'archivado' && this.statusFilter === 'archivado') {
          // Quitar el mensaje de la lista si estamos viendo solo archivados
          this.messages = this.messages.filter(m => m.id !== id);

          // Si el panel de detalle está abierto y muestra este mensaje, cerrarlo
          if (this.isDetailOpen && this.selectedMessage.id === id) {
            this.closeDetail();
          }
        }
        // Caso 2: Si estamos archivando un mensaje y no filtramos por archivados
        else if (status === 'archivado' && this.statusFilter !== 'archivado') {
          // Añadir clase para animación de desaparición
          const messageElement = document.querySelector(`[data-message-id="${id}"]`);
          if (messageElement) {
            messageElement.classList.add('archiving-animation');

            // Quitar de la lista después de la animación
            setTimeout(() => {
              this.messages = this.messages.filter(m => m.id !== id);

              // Si el panel de detalle está abierto y muestra este mensaje, cerrarlo
              if (this.isDetailOpen && this.selectedMessage.id === id) {
                this.closeDetail();
              }
            }, 500); // Tiempo de duración de la animación
          } else {
            // Si no encontramos el elemento, actualizar inmediatamente
            this.messages = this.messages.filter(m => m.id !== id);

            if (this.isDetailOpen && this.selectedMessage.id === id) {
              this.closeDetail();
            }
          }
        }
        // Caso 3: Para todos los demás casos (ej. marcar como leído)
        else {
          // Actualizar el estado del mensaje en la lista local
          this.messages = this.messages.map(m =>
            m.id === id ? { ...m, status: status } : m
          );
        }

        // Actualizar contadores
        this.updateMessageCounters();
      },
      error: (err) => {
        console.error('Error updating message status:', err);
      }
    });
  }

  // Método auxiliar para actualizar contadores
  updateMessageCounters(): void {
    // Si la lista se ha quedado vacía después de archivar y no estamos en la primera página
    if (this.messages.length === 0 && this.currentPage > 1) {
      this.currentPage--;
      this.loadMessages();
      return;
    }

    // Actualizar el contador de mensajes nuevos
    this.newMessagesCount = this.messages.filter(m => m.status === 'nuevo').length;

    // Si usas un contador total que no depende solo de la página actual
    // this.messageService.getMessageCounts().subscribe(counts => {
    //   this.totalMessages = counts.total;
    //   this.newMessagesCount = counts.new;
    // });
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

  // Añadir este método al componente
  formatMessageText(text: string): string {
    if (!text) return '';

    // Normalizar diferentes tipos de saltos de línea
    return text
      .replace(/\\n/g, '\n')  // Convertir la cadena literal "\n" a un salto de línea real
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea Windows a Unix
      .replace(/\n{3,}/g, '\n\n'); // Reducir múltiples saltos de línea a máximo dos
  }
}
