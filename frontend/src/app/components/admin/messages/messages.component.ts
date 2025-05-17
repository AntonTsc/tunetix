import { animate, group, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MessageResponse, MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';

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
export class AdminMessagesComponent implements OnInit {
  messages: any[] = [];
  selectedMessage: any = {};
  isDetailOpen: boolean = false;
  animatingClose: boolean = false;
  newMessagesCount: number = 0;
  loading: boolean = true;
  error: string = '';
  currentPage: number = 1;
  messagesPerPage: number = 6;
  totalMessages: number = 0;
  totalPages: number = 1;
  statusFilter: string = '';
  isStatusDropdownOpen = false;
  responseText: string = '';
  respondLoading: boolean = false;

  // Nueva propiedad para búsqueda
  searchTerm: string = '';

  // Añadir la propiedad searchType
  searchType: string = 'all';  // 'all' | 'subject' | 'user'

  // Nuevo indicador para animaciones durante cambio de página
  isChangingPage: boolean = false;

  // Nuevas propiedades para el modal de confirmación
  showConfirmModal: boolean = false;
  confirmModalClosing: boolean = false;
  confirmAction: 'archive' | 'delete' = 'delete';
  selectedConfirmMessage: any = null;

  // Para usar Math en el template
  Math = Math;

  // API URL property
  apiUrl = environment.apiUrl;

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

  // Añadir método para obtener el placeholder dependiendo del tipo de búsqueda
  getSearchPlaceholder(): string {
    switch (this.searchType) {
      case 'subject':
        return 'Buscar por asunto...';
      case 'user':
        return 'Buscar usuario...';
      default:
        return 'Buscar...';
    }
  }

  // Actualizar el método loadMessages para incluir searchType
  loadMessages(): void {
    this.loading = true;

    this.messageService.getMessagesWithParams(
      this.currentPage,
      this.messagesPerPage,
      this.statusFilter,
      this.searchTerm,
      this.searchType  // Añadir el tipo de búsqueda
    ).subscribe({
      next: (response: MessageResponse) => {
        this.messages = response.data;
        this.totalMessages = response.pagination.total;
        this.totalPages = response.pagination.totalPages;
        this.newMessagesCount = response.pagination.new_count || 0;
        this.loading = false;
        this.isChangingPage = false;
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.error = 'No se pudieron cargar los mensajes. Inténtalo de nuevo más tarde.';
        this.loading = false;
        this.isChangingPage = false;
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

    // Bloquear el scroll del cuerpo cuando se abre el panel
    document.body.style.overflow = 'hidden';

    // Comentamos o eliminamos esta parte para que no marque como leído automáticamente
    // if (message.status === 'nuevo') {
    //   this.updateStatus(message.id, 'leído');
    //   message.status = 'leído';
    // }
  }

  closeDetail(): void {
    // Primero, actualiza el estado para permitir que se active la animación
    this.animatingClose = true;

    // Restaurar el scroll del cuerpo cuando se cierra el panel
    document.body.style.overflow = 'auto';

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

  // Método mejorado de cambio de página con animación
  changePage(page: number): void {
    // Validar que la página solicitada sea un número y esté dentro del rango válido
    if (typeof page !== 'number' || isNaN(page) || page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.isChangingPage = true;
    this.currentPage = page;

    // Agregar un pequeño delay para que la animación sea visible
    setTimeout(() => {
      this.loadMessages();
      // Scroll al inicio de la tabla con una comprobación más segura
      setTimeout(() => {
        const tableElement = document.querySelector('.message-table-container');
        if (tableElement) {
          const topPosition = tableElement.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({
            top: topPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }, 300);

    // Restaurar el estado después de cargar
    setTimeout(() => {
      this.isChangingPage = false;
    }, 600);
  }

  // Método mejorado para aplicar filtros con animación
  applyFilter(): void {
    // Eliminar espacios al principio y al final del término de búsqueda
    if (this.searchTerm) {
      this.searchTerm = this.searchTerm.trim();
    }

    // Indicar que se está cambiando de página para mostrar animación
    this.isChangingPage = true;

    // Reiniciar a la primera página al aplicar un filtro
    this.currentPage = 1;

    // Pequeño retraso para la animación
    setTimeout(() => {
      this.loadMessages();
    }, 300);

    // Restaurar estado después de cargar
    setTimeout(() => {
      this.isChangingPage = false;
    }, 600);
  }

  clearFilter(): void {
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadMessages();
  }

  // Método para obtener las clases CSS según el estado del mensaje con efectos visuales mejorados
  getStatusClass(status: string): string {
    switch (status) {
      case 'nuevo':
        return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200';
      case 'leído':
        return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200';
      case 'respondido':
        return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200';
      case 'archivado':
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
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

  // Método mejorado para formatear texto del mensaje
  formatMessageText(text: string): string {
    if (!text) return '';

    // Normalizar diferentes tipos de saltos de línea
    const normalized = text
      .replace(/\\n/g, '\n')  // Convertir la cadena literal "\n" a un salto de línea real
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea Windows a Unix
      .replace(/\n{3,}/g, '\n\n'); // Reducir múltiples saltos de línea a máximo dos

    // Detectar y formatear URLs como enlaces clicables - podría ser habilitado en futuras versiones
    // return normalized.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" target="_blank" class="text-indigo-600 hover:underline">${url}</a>`);

    return normalized;
  }

  // Método para obtener la URL completa de la imagen de perfil
  getProfileImageUrl(imagePath: string): string {
    if (!imagePath) return '';

    // Si la ruta ya es una URL completa (comienza con http), devolverla tal cual
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Si es una ruta relativa, añadir la URL base del backend
    return `${this.apiUrl}/${imagePath}`;
  }

  // Método para obtener el rango de paginación
  getPaginationRange(): (number | string)[] {
    const visiblePages = 5; // Número de páginas visibles en la paginación
    const range: (number | string)[] = [];

    if (this.totalPages <= visiblePages) {
      // Si hay menos páginas que el número visible, mostrar todas
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      range.push(1);

      // Determinar el rango de páginas alrededor de la página actual
      let start = Math.max(2, this.currentPage - Math.floor(visiblePages / 2));
      let end = Math.min(this.totalPages - 1, start + visiblePages - 3);

      // Ajustar el inicio si estamos cerca del final
      if (end === this.totalPages - 1) {
        start = Math.max(2, end - (visiblePages - 3));
      }

      // Añadir puntos suspensivos si hay un salto desde la primera página
      if (start > 2) {
        range.push('...');
      }

      // Añadir las páginas intermedias
      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Añadir puntos suspensivos si hay un salto hasta la última página
      if (end < this.totalPages - 1) {
        range.push('...');
      }

      // Siempre mostrar la última página
      range.push(this.totalPages);
    }

    return range;
  }
}
