import { Component, OnInit } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class AdminUsersComponent implements OnInit {
  // Añadir Math como propiedad para usarlo en el template
  math = Math;

  allUsers: any[] = []; // Almacena todos los usuarios
  filteredUsers: any[] = []; // Almacena usuarios después de aplicar filtros
  users: any[] = []; // Almacena los usuarios de la página actual
  loading = false;
  error = '';
  serverResponse: ServerResponse | null = null;
  currentUser: any = null;

  // Propiedades de paginación
  currentPage = 1;
  usersPerPage = 6; // 6 usuarios por página
  totalPages = 1;
  totalFilteredUsers = 0;

  // Propiedades de filtrado
  roleFilter: string = ''; // '', 'admin', 'user'

  // Alert properties
  alertVisible = false;
  alertType = '';
  alertMessage = '';

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
    this.currentUser = this.authService.getCurrentUserData();
  }

  // Verificar si un usuario es el usuario actual
  isSelf(userId: number): boolean {
    return this.currentUser && this.currentUser.id === userId;
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

  // Aplicar filtros a la lista de usuarios
  applyFilter(): void {
    // Filtrar por rol si hay un filtro seleccionado
    if (this.roleFilter) {
      this.filteredUsers = this.allUsers.filter(user => user.role === this.roleFilter);
    } else {
      this.filteredUsers = [...this.allUsers]; // Sin filtro, mostrar todos
    }

    this.totalFilteredUsers = this.filteredUsers.length;
    this.calculateTotalPages();
    this.currentPage = 1; // Resetear a primera página cuando cambia el filtro
    this.applyPagination();
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

  // Cambiar de página
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();

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
}
