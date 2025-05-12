import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';
import { ContactService } from 'src/app/services/contact.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css']
})
export class ContactoComponent implements OnInit, OnDestroy {
  contactForm!: FormGroup;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  currentUser: any;
  alertServerResponse: ServerResponse = { status: 'OK', message: '' };

  // Suscripciones para manejar eventos
  private authSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    // Initialize the form with default empty values in the constructor
    // to ensure it always exists before the template tries to use it
    this.contactForm = this.formBuilder.group({
      name: [{value: '', disabled: true}, Validators.required],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    // Verificar si el usuario está autenticado usando getCookies() en vez de isAuthenticated()
    this.authService.getCookies().subscribe({
      next: (data: any) => {
        if (!data.data.access_token || !data.data.refresh_token) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/contacto' }
          });
          return;
        }

        // Usuario autenticado, seguir con la inicialización
        this.initializePage();
      },
      error: () => {
        // Error al verificar autenticación, redirigir a login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/contacto' }
        });
      }
    });
  }

  // Método para inicializar la página una vez se ha verificado la autenticación
  private initializePage(): void {
    // Suscribirse a datos de usuario del AuthService
    this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.currentUser = userData;
        this.updateFormValues();
      }
    });

    // Inicializar con datos del servicio, no del localStorage
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response.status === 'OK' && response.data) {
          this.currentUser = response.data;
          this.initForm();
        }
      },
      error: (error) => {
        console.error('Error al cargar datos iniciales:', error);
      }
    });

    // Inicializar formulario (se actualizará cuando lleguen los datos)
    this.initForm();

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.authState$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.router.navigate(['/login']);
      }
    });

    // Suscribirse a cambios en los datos del usuario
    this.userSubscription = this.userService.userData$.subscribe(userData => {
      if (userData) {
        // Actualizar los datos del usuario cuando cambien
        this.currentUser = userData;
        // Actualizar el formulario con los nuevos datos
        this.updateFormValues();
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  // Cargar datos actualizados del usuario
  loadUserData(): void {
    // Verificar autenticación usando getCookies en lugar de isAuthenticated
    this.authService.getCookies().subscribe({
      next: (data: any) => {
        if (data.data.access_token || data.data.refresh_token) {
          this.userService.getUserProfile().subscribe({
            next: () => {
              // Los datos se actualizan automáticamente a través de la suscripción
            },
            error: (error) => {
              console.error('Error al cargar datos del usuario:', error);
            }
          });
        }
      }
    });
  }

  initForm(): void {
    // Valores predeterminados en caso de que no haya datos del usuario
    let userName = '';
    let userEmail = '';

    // Extraer los datos del usuario si están disponibles
    if (this.currentUser) {
      // Verificar si los campos first_name y last_name están presentes (según localStorage)
      if (this.currentUser.first_name && this.currentUser.last_name) {
        userName = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
      }
      // Verificar si los campos nombre y apellidos están presentes (por si acaso)
      else if (this.currentUser.nombre && this.currentUser.apellidos) {
        userName = `${this.currentUser.nombre} ${this.currentUser.apellidos}`;
      }
      // Solo first_name o nombre
      else if (this.currentUser.first_name) {
        userName = this.currentUser.first_name;
      }
      else if (this.currentUser.nombre) {
        userName = this.currentUser.nombre;
      }
      // Nombre de usuario como último recurso
      else if (this.currentUser.username) {
        userName = this.currentUser.username;
      }

      // Obtener el email
      userEmail = this.currentUser.email || '';
    }

    this.contactForm = this.formBuilder.group({
      name: [{value: userName, disabled: true}, Validators.required],
      email: [{value: userEmail, disabled: true}, [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  // Método para actualizar valores del formulario sin recrearlo
  updateFormValues(): void {
    let userName = '';
    let userEmail = '';

    if (this.currentUser) {
      // Construir el nombre completo
      if (this.currentUser.first_name && this.currentUser.last_name) {
        userName = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
      } else if (this.currentUser.first_name) {
        userName = this.currentUser.first_name;
      }

      // Obtener el email
      userEmail = this.currentUser.email || '';
    }

    // Solo actualizar los valores del formulario existente
    if (this.contactForm) {
      this.contactForm.get('name')?.setValue(userName);
      this.contactForm.get('email')?.setValue(userEmail);
    }
  }

  // Getter para facilitar el acceso a los campos del formulario
  get f() { return this.contactForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Detener si el formulario es inválido
    if (this.contactForm.invalid) {
      return;
    }

    this.loading = true;

    // Obtener el ID del usuario del currentUser
    const userId = this.currentUser?.id || 0;

    // Incluir los valores deshabilitados manualmente y el ID del usuario
    const formData = {
      ...this.contactForm.getRawValue(), // Obtiene todos los valores incluyendo los deshabilitados
      user_id: userId, // Añadir el ID del usuario desde el objeto currentUser
      date: new Date(),
      status: 'nuevo'
    };

    this.contactService.submitContactForm(formData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Tu mensaje ha sido enviado correctamente.';
          // Configurar alertServerResponse
          this.alertServerResponse = {
            status: 'OK',
            message: 'Tu mensaje ha sido enviado correctamente.'
          };
          // Resetear formulario
          this.contactForm.reset();
          this.submitted = false;
          this.updateFormValues(); // Actualizar con los datos del usuario nuevamente
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Hubo un problema al enviar tu mensaje.';
          // Configurar alertServerResponse
          this.alertServerResponse = {
            status: 'ERROR',
            message: 'Hubo un problema al enviar tu mensaje.'
          };
          console.error('Error al enviar formulario:', error);
        }
      });
  }
}
