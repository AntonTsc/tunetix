import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import ServerResponse from 'src/app/interfaces/ServerResponse';
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

  // Formularios para validación
  nameForm: FormGroup;
  emailForm: FormGroup;
  passwordForm: FormGroup;

  loading = false;
  updateLoading = false;
  serverResponse: ServerResponse | null = null;

  // Para cambio de contraseña
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // For file uploads
  selectedFile: File | null = null;

  constructor(private userService: UserService, private fb: FormBuilder) {
    // Inicializar formularios con validadores
    this.nameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });

    this.emailForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.checkPasswords
    });
  }

  // Validator para comprobar que las contraseñas coinciden
  checkPasswords(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { notSame: true };
  }

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

          // Actualizar formularios con los datos cargados
          this.nameForm.patchValue({
            name: this.userData.name,
            lastName: this.userData.lastName
          });

          this.emailForm.patchValue({
            email: this.userData.email
          });

          this.loading = false;
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error desconocido al cargar datos'
          };
          this.loading = false;
        }
      },
      error: (err) => {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al cargar datos: ' + (err.message || 'Error desconocido')
        };
        this.loading = false;
        console.error('Error al cargar datos del usuario:', err);
      }
    });
  }

  toggleEdit(field: string): void {
    // Si estamos cancelando una edición, restauramos los valores originales
    if (this.editingField[field as keyof typeof this.editingField]) {
      if (field === 'name') {
        this.nameForm.patchValue({
          name: this.originalData.name,
          lastName: this.originalData.lastName
        });
        this.userData.name = this.originalData.name;
        this.userData.lastName = this.originalData.lastName;
      } else if (field === 'email') {
        this.emailForm.patchValue({
          email: this.originalData.email
        });
        this.userData.email = this.originalData.email;
      } else if (field === 'password') {
        this.passwordForm.reset();
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

    // Limpiar mensajes al cambiar de modo
    this.serverResponse = null;

    // Toggle del estado de edición
    this.editingField[field as keyof typeof this.editingField] =
      !this.editingField[field as keyof typeof this.editingField];
  }

  saveProfile(field: string): void {
    this.serverResponse = null;

    // Validar formulario según el campo que se está editando
    if (field === 'name') {
      if (this.nameForm.invalid) {
        // Marcar controles como touched para mostrar errores
        Object.keys(this.nameForm.controls).forEach(key => {
          this.nameForm.get(key)?.markAsTouched();
        });
        this.serverResponse = {
          status: 'ERROR',
          message: 'Por favor, completa correctamente el nombre y apellido'
        };
        return;
      }

      // Actualizar userData con los valores del formulario
      this.userData.name = this.nameForm.value.name;
      this.userData.lastName = this.nameForm.value.lastName;
    } else if (field === 'email') {
      if (this.emailForm.invalid) {
        // Marcar controles como touched para mostrar errores
        this.emailForm.get('email')?.markAsTouched();
        this.serverResponse = {
          status: 'ERROR',
          message: 'Por favor, ingresa un correo electrónico válido'
        };
        return;
      }

      // Actualizar userData con el valor del formulario
      this.userData.email = this.emailForm.value.email;
    }

    this.updateLoading = true;
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
          this.serverResponse = {
            status: 'OK',
            message: 'Datos actualizados correctamente'
          };

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
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error desconocido al actualizar'
          };
        }
        this.updateLoading = false;
      },
      error: (err) => {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al actualizar datos: ' + (err.message || 'Error desconocido')
        };
        this.updateLoading = false;
        console.error('Error al actualizar datos del usuario:', err);
      }
    });
  }

  updatePassword(): void {
    // Limpiar cualquier mensaje previo
    this.serverResponse = null;

    // Validar el formulario de contraseña
    if (this.passwordForm.invalid) {
      // Marcar todos los controles como touched para mostrar errores
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });

      // Mostrar mensaje de error específico
      if (this.passwordForm.errors?.['notSame']) {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Las contraseñas no coinciden'
        };
      } else {
        this.serverResponse = {
          status: 'ERROR',
          message: 'Por favor, completa correctamente todos los campos de contraseña'
        };
      }
      return;
    }

    // Actualizar valores desde el formulario
    this.passwordData = this.passwordForm.value;

    this.updateLoading = true;
    this.userService.updatePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: (response) => {
        this.updateLoading = false;

        if (response.status === 'OK') {
          this.serverResponse = {
            status: 'OK',
            message: 'Contraseña actualizada correctamente'
          };
          this.passwordForm.reset();
          this.editingField.password = false;
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error al actualizar contraseña'
          };
        }
      },
      error: (err) => {
        this.updateLoading = false;
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al actualizar contraseña: ' + (err.message || 'Error desconocido')
        };
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
      this.serverResponse = null;

      this.userService.updateProfileImage(this.selectedFile).subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.serverResponse = {
              status: 'OK',
              message: 'Imagen de perfil actualizada correctamente'
            };
            this.userData.profileImage = response.data.image_path;
            this.selectedFile = null;
          } else {
            this.serverResponse = {
              status: 'ERROR',
              message: response.message || 'Error al actualizar imagen'
            };
          }
          this.updateLoading = false;
        },
        error: (err) => {
          this.serverResponse = {
            status: 'ERROR',
            message: 'Error al subir imagen: ' + (err.message || 'Error desconocido')
          };
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
