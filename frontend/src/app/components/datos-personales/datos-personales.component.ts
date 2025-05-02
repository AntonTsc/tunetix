import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { UpdateUserData, UserService } from '../../services/user.service';

// Validador personalizado para permitir solo letras, espacios y algunos caracteres como ñ, tildes
export function onlyLettersValidator(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} | null => {
    // Expresión regular que permite letras (incluyendo ñ y tildes), espacios y guiones
    const valid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]+$/.test(control.value);
    return !valid ? {'invalidCharacters': {value: control.value}} : null;
  };
}

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
    profileImage: null as string | null,
    id: 0,
    createdAt: '',
    updatedAt: ''
  };

  // Formularios para validación
  nameForm: FormGroup = new FormGroup({});
  emailForm: FormGroup = new FormGroup({});
  passwordForm: FormGroup = new FormGroup({});

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
  previewImage: string | null = null;

  // Propiedades para eliminación de foto de perfil
  showDeleteConfirmModal = false;
  deletingImage = false;

  // Propiedad para controlar la visibilidad del menú
  showPhotoMenu = false;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar userData con valores vacíos para evitar errores
    this.userData = {
      name: '',
      lastName: '',
      email: '',
      profileImage: null,
      id: 0,
      createdAt: '',
      updatedAt: ''
    };

    this.initForms();
  }

  // Método para inicializar los formularios
  initForms() {
    this.nameForm = this.fb.group({
      name: [
        this.userData?.name || '', // Valor por defecto para evitar null/undefined
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          onlyLettersValidator() // Añadir el validador personalizado
        ]
      ],
      lastName: [
        this.userData?.lastName || '', // Valor por defecto para evitar null/undefined
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          onlyLettersValidator() // Añadir el validador personalizado
        ]
      ]
    });

    this.emailForm = this.fb.group({
      email: [this.userData?.email || '', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
        Validators.maxLength(100)
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

  // Método para abrir el modal de confirmación de eliminación
  confirmDeleteImage(): void {
    this.showDeleteConfirmModal = true;
    this.showPhotoMenu = false; // Cerrar el menú al confirmar eliminación
  }

  // Método para cancelar la eliminación
  cancelDeleteImage(): void {
    this.showDeleteConfirmModal = false;
  }

  // Método para eliminar la imagen
  deleteImage(): void {
    this.deletingImage = true;

    this.userService.deleteProfileImage().subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          // Actualizar userData con la imagen eliminada
          this.userData.profileImage = null;

          // Mostrar mensaje de éxito
          this.serverResponse = {
            status: 'OK',
            message: response.message || 'La imagen de perfil ha sido eliminada correctamente'
          };

          // Actualizar también el AuthService para que refleje los cambios en la sesión actual
          // sin usar localStorage, solo la instancia en memoria
          const currentUser = this.authService.getCurrentUserData();
          if (currentUser) {
            currentUser.image_path = null;
            // No usar TokenService.saveUser ya que eso guardaría en localStorage
            // En lugar de eso, actualizar directamente el servicio de autenticación
            this.authService.updateSessionUserData(currentUser);
          }
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error al eliminar la imagen'
          };
        }

        // Cerrar el modal y resetear el estado
        this.showDeleteConfirmModal = false;
        this.deletingImage = false;

        // Forzar detección de cambios
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar la imagen de perfil:', err);
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al eliminar la imagen: ' + (err.message || 'Error desconocido')
        };
        this.deletingImage = false;
        this.showDeleteConfirmModal = false;
      }
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

  // Método para manejar la selección de archivos
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      console.log('Archivo seleccionado:', this.selectedFile.name, this.selectedFile.type);

      // Crear una vista previa de la imagen seleccionada
      const reader = new FileReader();
      reader.onload = (e) => {
        // Aquí es donde actualizamos la vista previa
        this.previewImage = e.target?.result as string;

        // NO actualizamos userData.profileImage aquí para no confundir al usuario
        // Solo usamos previewImage para mostrar la vista previa
      };
      reader.readAsDataURL(this.selectedFile);

      // Limpiar cualquier mensaje de error previo
      this.serverResponse = null;

      // Cerrar el menú desplegable después de seleccionar un archivo
      this.showPhotoMenu = false;
    }
  }

  // Método para subir la imagen seleccionada
  uploadImage(): void {
    if (!this.selectedFile) {
      this.serverResponse = {
        status: 'ERROR',
        message: 'No se ha seleccionado ninguna imagen'
      };
      return;
    }

    this.updateLoading = true;

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    console.log('FormData creado:', this.selectedFile.name, this.selectedFile.type, this.selectedFile.size);

    this.userService.updateProfileImage(formData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);

        if (response.status === 'OK') {
          // Actualizar el perfil con la nueva imagen
          this.userData.profileImage = response.data.image_path;

          // Mostrar mensaje de éxito
          this.serverResponse = {
            status: 'OK',
            message: 'Imagen de perfil actualizada correctamente'
          };

          // Actualizar el AuthService
          const currentUser = this.authService.getCurrentUserData();
          if (currentUser) {
            currentUser.image_path = response.data.image_path;
            this.authService.updateSessionUserData(currentUser);
          }

          // Resetear el archivo seleccionado y la vista previa
          this.selectedFile = null;
          this.previewImage = null;
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error al actualizar la imagen'
          };
        }

        this.updateLoading = false;

        // Forzar detección de cambios
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error completo:', err);
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al subir imagen: ' + (err.message || 'Error desconocido')
        };
        this.updateLoading = false;
      }
    });
  }

  // Helper method to check if user has a profile image
  hasProfileImage(): boolean {
    return this.userData.profileImage !== null && this.userData.profileImage !== '';
  }

  // Helper method to get full name
  getFullName(): string {
    return `${this.userData.name} ${this.userData.lastName}`.trim();
  }

  // Método para alternar la visibilidad del menú
  togglePhotoMenu(event?: Event): void {
    if (event) {
      event.stopPropagation(); // Evitar que el clic se propague al documento
    }
    this.showPhotoMenu = !this.showPhotoMenu;
  }

  // Manejador de clic para cerrar el menú cuando se haga clic fuera
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    // Solo actuar si el menú está abierto
    if (this.showPhotoMenu) {
      const clickedElement = event.target as HTMLElement;
      const photoMenu = document.querySelector('.menu-opciones-foto');
      const photoButton = document.querySelector('[title="Opciones de foto"]');

      // Si se hizo clic fuera del menú y del botón
      if (
        photoButton &&
        !photoButton.contains(clickedElement) &&
        photoMenu &&
        !photoMenu.contains(clickedElement)
      ) {
        this.showPhotoMenu = false;
        this.cdr.detectChanges();
      }
    }
  }

  // Método para prevenir la entrada de caracteres no permitidos
  onKeyPress(event: KeyboardEvent): boolean {
    // Permitir letras, espacios, guiones, teclas de navegación y caracteres especiales como ñ y tildes
    const pattern = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // Evitar la entrada del carácter
      event.preventDefault();
      return false;
    }
    return true;
  }
}
