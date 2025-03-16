import { Component, OnInit } from '@angular/core';
import { UpdateUserData, UserService } from '../../services/user.service';

@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  styleUrls: ['./datos-personales.component.css']
})
export class DatosPersonalesComponent implements OnInit {
  editingField = {
    name: false,
    email: false,
    password: false
  };

  // Para almacenar valores originales antes de editar
  originalData = {
    name: '',
    lastName: '',
    email: ''
  };

  // User profile data
  userData = {
    name: '',
    lastName: '',
    email: '',
    profileImage: null as string | null, // Allow both string and null
    id: 0,
    createdAt: '',
    updatedAt: ''
  };

  loading = false;
  updateLoading = false;
  error = '';
  updateMessage = '';

  // Para cambio de contraseña
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // For file uploads
  selectedFile: File | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loading = true;
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.userData = {
            id: response.data.id,
            name: response.data.first_name,
            lastName: response.data.last_name,
            email: response.data.email,
            profileImage: response.data.image_path,
            createdAt: response.data.created_at,
            updatedAt: response.data.updated_at
          };

          // Guardar datos originales
          this.originalData = {
            name: this.userData.name,
            lastName: this.userData.lastName,
            email: this.userData.email
          };

          this.loading = false;
        } else {
          this.error = response.message || 'Error desconocido';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error desconocido');
        this.loading = false;
        console.error('Error al cargar datos del usuario:', err);
      }
    });
  }

  toggleEdit(field: string): void {
    // Si estamos cancelando una edición, restauramos los valores originales
    if (this.editingField[field as keyof typeof this.editingField]) {
      if (field === 'name') {
        this.userData.name = this.originalData.name;
        this.userData.lastName = this.originalData.lastName;
      } else if (field === 'email') {
        this.userData.email = this.originalData.email;
      } else if (field === 'password') {
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      }
    } else {
      // Si estamos comenzando a editar, guardamos los valores originales
      if (field === 'name') {
        this.originalData.name = this.userData.name;
        this.originalData.lastName = this.userData.lastName;
      } else if (field === 'email') {
        this.originalData.email = this.userData.email;
      }
    }

    // Toggle del estado de edición
    this.editingField[field as keyof typeof this.editingField] =
      !this.editingField[field as keyof typeof this.editingField];
  }

  saveProfile(field: string): void {
    this.updateLoading = true;
    this.updateMessage = '';

    let updateData: UpdateUserData = {};

    if (field === 'name') {
      updateData = {
        name: this.userData.name,
        lastName: this.userData.lastName
      };
    } else if (field === 'email') {
      updateData = {
        email: this.userData.email
      };
    }

    this.userService.updateUserProfile(updateData).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.updateMessage = 'Datos actualizados correctamente';
          this.userData = {
            ...this.userData,
            name: response.data.first_name,
            lastName: response.data.last_name,
            email: response.data.email,
            updatedAt: response.data.updated_at
          };

          // Actualizar datos originales con los nuevos valores
          this.originalData = {
            name: this.userData.name,
            lastName: this.userData.lastName,
            email: this.userData.email
          };

          // Cerrar el modo de edición
          this.editingField[field as keyof typeof this.editingField] = false;
        } else {
          this.error = response.message || 'Error desconocido al actualizar';
        }
        this.updateLoading = false;
      },
      error: (err) => {
        this.error = 'Error al actualizar datos: ' + (err.message || 'Error desconocido');
        this.updateLoading = false;
        console.error('Error al actualizar datos del usuario:', err);
      }
    });
  }

  updatePassword(): void {
    // Validación básica
    if (!this.passwordData.currentPassword ||
        !this.passwordData.newPassword ||
        !this.passwordData.confirmPassword) {
      this.error = 'Todos los campos son obligatorios';
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.updateLoading = true;
    this.userService.updatePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.updateMessage = 'Contraseña actualizada correctamente';
          this.toggleEdit('password'); // Cerrar el formulario
        } else {
          this.error = response.message || 'Error al actualizar contraseña';
        }
        this.updateLoading = false;
      },
      error: (err) => {
        this.error = 'Error al actualizar contraseña: ' + (err.message || 'Error desconocido');
        this.updateLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        this.userData.profileImage = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (this.selectedFile) {
      this.updateLoading = true;
      this.error = '';
      this.updateMessage = '';

      this.userService.updateProfileImage(this.selectedFile).subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.updateMessage = 'Imagen de perfil actualizada correctamente';
            this.userData.profileImage = response.data.image_path;
            this.selectedFile = null;
          } else {
            this.error = response.message || 'Error al actualizar imagen';
          }
          this.updateLoading = false;
        },
        error: (err) => {
          this.error = 'Error al subir imagen: ' + (err.message || 'Error desconocido');
          this.updateLoading = false;
          console.error('Error al subir imagen:', err);
        }
      });
    }
  }

  // Helper method to check if user has a profile image
  hasProfileImage(): boolean {
    return this.userData.profileImage !== null && this.userData.profileImage !== '';
  }

  // Helper method to get full name
  getFullName(): string {
    return `${this.userData.name} ${this.userData.lastName}`.trim();
  }
}
