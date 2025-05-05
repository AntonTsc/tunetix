import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
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

  // Añadir nueva propiedad para controlar si el usuario es de Google
  isGoogleAccount: boolean = false;
  // Nuevo campo para la sección de añadir contraseña para cuentas de Google
  googlePasswordForm: FormGroup = new FormGroup({});
  // Controlar si se está editando la contraseña de Google
  editingGooglePassword: boolean = false;

  // Añadir nueva propiedad para controlar si el usuario tiene contraseña
  hasPassword: boolean = false;

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

  // Nueva propiedad para rastrear errores de imagen
  hasImageError: boolean = false;

  // Para el control de animaciones del menú de opciones
  menuExitAnimation = false;

  constructor(
    public userService: UserService,
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef,
    private imageService: ImageService
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

    // Inicializar formulario para añadir contraseña a cuenta de Google
    this.googlePasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.checkGooglePasswords
    });
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

  // Validator para las contraseñas de Google
  checkGooglePasswords(group: FormGroup) {
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

          // Verificar si es cuenta de Google
          this.isGoogleAccount = response.data.auth_provider === 'google';

          // Verificar si tiene contraseña configurada
          this.hasPassword = response.data.has_password === true;

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

      // Desactivar el modo de edición para el campo actual
      this.editingField[field as keyof typeof this.editingField] = false;
    } else {
      // Si vamos a comenzar a editar un campo, primero cerramos cualquier otro campo en edición
      Object.keys(this.editingField).forEach(key => {
        // Si hay otro campo en edición, lo restauramos a su valor original
        if (this.editingField[key as keyof typeof this.editingField]) {
          if (key === 'name') {
            this.nameForm.patchValue({
              name: this.originalData.name,
              lastName: this.originalData.lastName
            });
            this.userData.name = this.originalData.name;
            this.userData.lastName = this.originalData.lastName;
          } else if (key === 'email') {
            this.emailForm.patchValue({
              email: this.originalData.email
            });
            this.userData.email = this.originalData.email;
          } else if (key === 'password') {
            this.passwordForm.reset();
            this.passwordData = {
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            };
          }

          // Desactivamos su modo de edición
          this.editingField[key as keyof typeof this.editingField] = false;
        }
      });

      // Si estamos comenzando a editar, guardamos los valores originales
      if (field === 'name') {
        this.originalData.name = this.userData.name;
        this.originalData.lastName = this.userData.lastName;
      } else if (field === 'email') {
        this.originalData.email = this.userData.email;
      }

      // Activar el modo de edición para el campo actual
      this.editingField[field as keyof typeof this.editingField] = true;

      // Si estamos activando la edición de algún campo, desactivamos la edición de contraseña de Google
      if (this.editingGooglePassword) {
        this.toggleGooglePasswordEdit();
      }
    }

    // Limpiar mensajes al cambiar de modo
    this.serverResponse = null;
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

        // Mensaje de error específico según el tipo de error
        if (this.nameForm.get('name')?.errors?.['invalidCharacters'] ||
            this.nameForm.get('lastName')?.errors?.['invalidCharacters']) {
          this.serverResponse = {
            status: 'ERROR',
            message: 'El nombre y apellido solo pueden contener letras y espacios'
          };
        } else if (this.nameForm.get('name')?.errors?.['required'] ||
                  this.nameForm.get('lastName')?.errors?.['required']) {
          this.serverResponse = {
            status: 'ERROR',
            message: 'Por favor, completa todos los campos requeridos'
          };
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: 'Por favor, completa correctamente el nombre y apellido'
          };
        }
        return;
      }

      // Actualizar userData con los valores del formulario
      this.userData.name = this.nameForm.value.name;
      this.userData.lastName = this.nameForm.value.lastName;

      // Verificar si ha habido cambios
      if (this.userData.name === this.originalData.name &&
          this.userData.lastName === this.originalData.lastName) {
        // No hay cambios, simplemente cerrar el modo de edición sin mostrar mensaje
        this.editingField[field as keyof typeof this.editingField] = false;
        return;
      }
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

      // Verificar si ha habido cambios
      if (this.userData.email === this.originalData.email) {
        // No hay cambios, simplemente cerrar el modo de edición sin mostrar mensaje
        this.editingField[field as keyof typeof this.editingField] = false;
        return;
      }
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

    // Evitar enviar la solicitud si la nueva contraseña está vacía
    if (!this.passwordData.newPassword.trim()) {
      this.serverResponse = {
        status: 'ERROR',
        message: 'La nueva contraseña no puede estar vacía'
      };
      return;
    }

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

          // Resetear el indicador de error de imagen
          this.hasImageError = false;

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

  // Modificar este método si existe, o agregar si no existe
  hasProfileImage(): boolean {
    return !!(this.userData && this.userData.profileImage && this.userData.profileImage.trim() !== '');
  }

  // Añadir el método que controla si se debe mostrar el SVG
  shouldShowSvgAvatar(): boolean {
    return this.imageService.shouldShowSvg(this.userData.profileImage);
  }

  // Método para obtener la URL de la imagen
  getProfileImageSrc(): string {
    return this.userData?.profileImage || '';
  }

  // Modificar o agregar el método para manejar errores de imagen
  onProfileImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;

    // Agregar clase para hacer la imagen transparente y dejar ver el SVG
    imgElement.classList.add('profile-image-error');

    console.warn('Error cargando imagen de perfil:', imgElement.src);
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

    if (this.showPhotoMenu) {
      // Si el menú está abierto, primero aplicamos la animación de salida
      this.menuExitAnimation = true;

      // Esperamos a que finalice la animación antes de ocultar el menú
      setTimeout(() => {
        this.showPhotoMenu = false;
        this.menuExitAnimation = false;
        this.cdr.detectChanges();
      }, 300); // Tiempo igual a la duración de la animación (0.3s)
    } else {
      // Si el menú está cerrado, lo mostramos directamente con la animación de entrada
      this.showPhotoMenu = true;
      this.menuExitAnimation = false;
    }
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

  // Método para activar el modo de edición de contraseña de Google
  toggleGooglePasswordEdit(): void {
    // Si vamos a activar la edición de contraseña de Google
    if (!this.editingGooglePassword) {
      // Primero cerramos cualquier otro campo en edición
      Object.keys(this.editingField).forEach(key => {
        if (this.editingField[key as keyof typeof this.editingField]) {
          // Restaurar valores originales
          if (key === 'name') {
            this.nameForm.patchValue({
              name: this.originalData.name,
              lastName: this.originalData.lastName
            });
            this.userData.name = this.originalData.name;
            this.userData.lastName = this.originalData.lastName;
          } else if (key === 'email') {
            this.emailForm.patchValue({
              email: this.originalData.email
            });
            this.userData.email = this.originalData.email;
          } else if (key === 'password') {
            this.passwordForm.reset();
            this.passwordData = {
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            };
          }

          // Desactivar el modo de edición
          this.editingField[key as keyof typeof this.editingField] = false;
        }
      });
    }

    // Toggle del estado de edición de contraseña de Google
    this.editingGooglePassword = !this.editingGooglePassword;

    if (!this.editingGooglePassword) {
      // Si estamos saliendo del modo de edición, resetear el formulario
      this.googlePasswordForm.reset();
    }

    // Limpiar mensajes al cambiar de modo
    this.serverResponse = null;
  }

  // Método para guardar la contraseña de la cuenta de Google
  // Reemplazar el método actual para no usar checkSession que da error
  addGooglePassword(): void {
    // Validar el formulario
    if (this.googlePasswordForm.invalid) {
      // Marcar todos los controles como touched para mostrar errores
      Object.keys(this.googlePasswordForm.controls).forEach(key => {
        this.googlePasswordForm.get(key)?.markAsTouched();
      });

      // Mostrar mensaje de error específico
      if (this.googlePasswordForm.errors?.['notSame']) {
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

    // Obtener la nueva contraseña
    const newPassword = this.googlePasswordForm.get('newPassword')?.value;

    // Verificar si la contraseña está vacía
    if (!newPassword.trim()) {
      this.serverResponse = {
        status: 'ERROR',
        message: 'La contraseña no puede estar vacía'
      };
      return;
    }

    // Mostrar indicador de carga
    this.updateLoading = true;

    // Llamada al servicio para añadir contraseña
    this.userService.addGooglePassword(newPassword).subscribe({
      next: (response) => {
        this.updateLoading = false;

        if (response.status === 'OK') {
          this.serverResponse = {
            status: 'OK',
            message: 'Contraseña añadida correctamente. Ahora puedes iniciar sesión con email y contraseña.'
          };

          // Actualizar el estado para mostrar que ahora tiene contraseña
          this.hasPassword = true;

          // Resetear formulario y cerrar panel de edición
          this.googlePasswordForm.reset();
          this.editingGooglePassword = false;
        } else {
          this.serverResponse = {
            status: 'ERROR',
            message: response.message || 'Error al añadir contraseña'
          };
        }
      },
      error: (err) => {
        this.updateLoading = false;
        this.serverResponse = {
          status: 'ERROR',
          message: 'Error al añadir contraseña: ' + (err.message || 'Error desconocido')
        };
      }
    });
  }
}
