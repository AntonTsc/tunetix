import { Component, OnInit } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class AdminUsersComponent implements OnInit {
  // Para usar Math en el template
  math = Math;

  allUsers: any[] = []; // Almacena todos los usuarios
  filteredUsers: any[] = []; // Almacena usuarios después de aplicar filtros
  users: any[] = []; // Almacena los usuarios de la página actual
  loading = false;
  error = '';
  serverResponse: ServerResponse | null = null;
  currentUser: any = null;

  // Búsqueda
  searchTerm: string = '';

  // Propiedades de paginación
  currentPage = 1;
  usersPerPage = 6; // 6 usuarios por página
  totalPages = 1;
  totalFilteredUsers = 0;
  isChangingPage = false;

  // Propiedades de filtrado
  roleFilter: string = ''; // '', 'admin', 'user'

  // Modal de confirmación
  showConfirmModal = false;
  confirmModalClosing = false;
  selectedConfirmUser: any = null;
  confirmNewRole: string = '';

  apiUrl = environment.apiUrl;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  // Cargar el usuario actual
  loadCurrentUser(): void {
    // Obtener los datos del usuario actual del servicio de autenticación
    this.currentUser = this.authService.getCurrentUserData();

    // Si no hay datos del usuario actual, solicitarlos
    if (!this.currentUser) {
      this.authService.fetchCurrentUserData().subscribe({
        next: (response) => {
          if (response && response.status === 'OK') {
            this.currentUser = response.data;
          }
        },
        error: (err) => {
          console.error('Error al obtener datos del usuario actual:', err);
        }
      });
    }
  }

  // Verificar si un usuario es el usuario actual
  isSelf(userId: number): boolean {
    return this.currentUser && this.currentUser.id === userId;
  }

  // Verificar si un usuario se ha autenticado a través de Google
  isGoogleUser(user: any): boolean {
    if (!user) return false;

    // Verificar directamente el campo auth_provider que ahora viene de la API
    if (user.auth_provider === 'google') {
      return true;
    }

    // Verificar si existe google_id como respaldo
    if (user.google_id && user.google_id.trim() !== '') {
      return true;
    }

    return false;
  }

  // Cargar todos los usuarios
  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response && response.status === 'OK') {
          this.allUsers = response.data || [];
          this.applyFilter(); // Aplicar filtro y paginación
        } else {
          this.error = response?.message || 'Error al cargar usuarios';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error de conexión al obtener usuarios';
        console.error('Error al cargar usuarios:', err);
        this.loading = false;
      }
    });
  }

  // Modificar la función applyFilter() para eliminar espacios en blanco
  applyFilter(): void {
    // Aplicar filtro de rol
    let filtered = [...this.allUsers];

    if (this.roleFilter) {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Aplicar búsqueda - limpiando espacios en blanco
    if (this.searchTerm) {
      // Eliminar espacios al principio y al final del término de búsqueda
      const search = this.searchTerm.trim().toLowerCase();

      // Solo continuar si hay algo que buscar después de eliminar espacios
      if (search) {
        filtered = filtered.filter(user =>
          (user.first_name || '').toLowerCase().includes(search) ||
          (user.last_name || '').toLowerCase().includes(search) ||
          (user.email || '').toLowerCase().includes(search)
        );
      }
    }

    this.filteredUsers = filtered;
    this.totalFilteredUsers = this.filteredUsers.length;
    this.calculateTotalPages();
    this.currentPage = 1; // Resetear a primera página cuando cambia el filtro
    this.applyPagination();
  }

  // Mostrar modal de confirmación para cambiar rol
  showRoleConfirm(user: any, newRole: string): void {
    this.selectedConfirmUser = user;
    this.confirmNewRole = newRole;
    this.showConfirmModal = true;
    this.confirmModalClosing = false;
  }

  // Cancelar cambio de rol
  cancelRoleConfirm(): void {
    this.confirmModalClosing = true;
    setTimeout(() => {
      this.showConfirmModal = false;
      this.selectedConfirmUser = null;
      this.confirmNewRole = '';
    }, 300); // Tiempo para la animación
  }

  // Confirmar cambio de rol
  confirmRoleChange(): void {
    if (!this.selectedConfirmUser || !this.confirmNewRole) return;

    this.updateUserRole(this.selectedConfirmUser.id, this.confirmNewRole);
    this.cancelRoleConfirm();
  }

  // Actualizar el rol de un usuario
  updateUserRole(userId: number, newRole: string): void {
    this.loading = true;
    this.serverResponse = null;

    this.userService.updateUserRole(userId, newRole).subscribe({
      next: (response) => {
        this.serverResponse = response;
        if (response.status === 'OK') {
          // Actualizar el rol localmente
          const userIndex = this.allUsers.findIndex(user => user.id === userId);
          if (userIndex !== -1) {
            this.allUsers[userIndex].role = newRole;
            this.applyFilter(); // Reaplica filtros y paginación
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error de conexión al actualizar rol'
        };
        console.error('Error al actualizar rol:', err);
        this.loading = false;
      }
    });
  }

  // Calcular el número total de páginas
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  // Aplicar paginación
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    const endIndex = startIndex + this.usersPerPage;
    this.users = this.filteredUsers.slice(startIndex, endIndex);
  }

  // Cambiar de página con animación
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.isChangingPage = true;
    this.currentPage = page;
    this.applyPagination();

    // Simular transición suave
    setTimeout(() => {
      this.isChangingPage = false;
    }, 300);

    // Scroll al inicio de la tabla con una comprobación más segura
    setTimeout(() => {
      const tableElement = document.querySelector('.users-table-container');
      if (tableElement) {
        const topPosition = tableElement.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({
          top: topPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  // Cambiar el filtro de rol
  setRoleFilter(role: string): void {
    this.roleFilter = role;
    this.applyFilter();
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
}
