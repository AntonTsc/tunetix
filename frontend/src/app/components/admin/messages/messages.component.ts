import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-admin-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class AdminMessagesComponent implements OnInit {
  messages: any[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 0;
  totalMessages = 0;
  messagesPerPage = 10;
  statusFilter: string = '';
  selectedMessage: any = null;
  isStatusDropdownOpen = false;
  isDetailOpen = false;
  newMessagesCount = 0;
  responseText: string = '';
  respondLoading: boolean = false;

  // Para usar Math en el template
  Math = Math;

  @ViewChild('statusDropdown') statusDropdownRef!: ElementRef;

  constructor(private contactService: ContactService) { }

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
    this.contactService.getMessages(this.currentPage, this.messagesPerPage, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.messages = response.data;
          this.totalMessages = response.total;
          this.totalPages = Math.ceil(response.total / this.messagesPerPage);
          this.newMessagesCount = response.new_count || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar mensajes:', error);
          this.loading = false;
        }
      });
  }

  viewMessage(message: any): void {
    this.selectedMessage = message;
    this.isDetailOpen = true;

    // Si el mensaje está sin leer, marcarlo como leído
    if (message.status === 'nuevo') {
      this.updateStatus(message.id, 'leído');
    }
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedMessage = null;
  }

  updateStatus(id: number, status: string): void {
    this.isStatusDropdownOpen = false;
    this.contactService.updateMessageStatus(id, status)
      .subscribe({
        next: () => {
          const messageIndex = this.messages.findIndex(m => m.id === id);
          if (messageIndex > -1) {
            if (this.messages[messageIndex].status === 'nuevo' && status !== 'nuevo') {
              this.newMessagesCount--;
            }
            this.messages[messageIndex].status = status;
          }

          if (this.selectedMessage && this.selectedMessage.id === id) {
            this.selectedMessage.status = status;
          }
        },
        error: (error) => console.error('Error al actualizar estado:', error)
      });
  }

  deleteMessage(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.')) {
      this.contactService.deleteMessage(id)
        .subscribe({
          next: () => {
            if (this.selectedMessage && this.selectedMessage.id === id) {
              this.closeDetail();
            }

            const messageIndex = this.messages.findIndex(m => m.id === id);
            if (messageIndex > -1) {
              if (this.messages[messageIndex].status === 'nuevo') {
                this.newMessagesCount--;
              }
              this.messages.splice(messageIndex, 1);
              this.totalMessages--;
            }
          },
          error: (error) => console.error('Error al eliminar mensaje:', error)
        });
    }
  }

  respondToMessage(): void {
    if (!this.selectedMessage || !this.responseText.trim()) {
      return;
    }

    this.respondLoading = true;
    this.contactService.respondMessage(this.selectedMessage.id, this.responseText)
      .subscribe({
        next: () => {
          this.updateStatus(this.selectedMessage.id, 'respondido');
          this.responseText = '';
          this.respondLoading = false;
          alert('Respuesta enviada correctamente');
        },
        error: (error) => {
          console.error('Error al enviar respuesta:', error);
          this.respondLoading = false;
          alert('Error al enviar la respuesta');
        }
      });
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
        return 'bg-blue-100 text-blue-800';
      case 'leído':
        return 'bg-green-100 text-green-800';
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
