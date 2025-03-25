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
  users: any[] = [];
  loading = false;
  error = '';
  serverResponse: ServerResponse | null = null;
  currentUser: any = null;

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

  loadCurrentUser(): void {
    // Cargar datos del usuario actual con el servicio
    this.authService.userData$.subscribe(userData => {
      this.currentUser = userData;
    });

    // Si no hay datos todavía, forzar la carga desde el servidor
    if (!this.currentUser) {
      this.authService.fetchCurrentUserData().subscribe();
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.users = response.data;
        } else {
          this.error = response.message || 'Error al cargar usuarios';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar usuarios';
        this.loading = false;
        console.error('Error cargando usuarios:', err);
      }
    });
  }

  updateUserRole(userId: number, newRole: string): void {
    // Use the immediate method
    this.userService.updateUserRoleImmediate(userId, newRole).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          // Success message
          this.showAlert('success', 'Rol actualizado correctamente');

          // Refresh the users list to show updated roles
          this.loadUsers();
        } else {
          this.showAlert('error', response.message || 'Error al actualizar rol');
        }
      },
      error: (error) => {
        console.error('Error updating user role:', error);
        this.showAlert('error', 'Error al actualizar rol');
      }
    });
  }

  // Method to show alerts
  showAlert(type: string, message: string): void {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;

    // Auto-hide the alert after 5 seconds
    setTimeout(() => {
      this.alertVisible = false;
    }, 5000);
  }

  // Method to hide alert
  hideAlert(): void {
    this.alertVisible = false;
  }

  // Método para saber si el usuario es el mismo que está logueado
  isSelf(userId: number): boolean {
    return this.currentUser && this.currentUser.id === userId;
  }
}
