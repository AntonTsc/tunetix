import { Component, OnInit } from '@angular/core';
import ServerResponse from 'src/app/interfaces/ServerResponse';
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

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      this.currentUser = JSON.parse(userData);
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
    this.serverResponse = null;

    this.userService.updateUserRole(userId, newRole).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          // Actualizar localmente el rol del usuario en la lista
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.role = newRole;
          }

          this.serverResponse = {
            status: 'OK',
            message: `Usuario actualizado a ${newRole} correctamente`
          };
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error al actualizar rol'
          };
        }
      },
      error: (err) => {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al actualizar rol de usuario'
        };
        console.error('Error actualizando rol:', err);
      }
    });
  }

  // Método para saber si el usuario es el mismo que está logueado
  isSelf(userId: number): boolean {
    return this.currentUser && this.currentUser.id === userId;
  }
}
