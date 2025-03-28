import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('userMenuAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px)',
        height: 0,
        overflow: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0)',
        height: '*',
        overflow: 'visible'
      })),
      transition('closed => open', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)') // Curva de aceleración más suave
      ]),
      transition('open => closed', [
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('dropdownAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        height: 0,
        // overflow: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        height: '*'
      })),
      transition('closed => open', [
        animate('200ms ease-out')
      ]),
      transition('open => closed', [
        animate('250ms ease-in')
      ])
    ]),
    trigger('mobileMenuAnimation', [
      state('closed', style({
        opacity: 0,
        maxHeight: '0px',
        overflow: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        maxHeight: '500px'
      })),
      transition('closed => open', [
        animate('300ms ease-out')
      ]),
      transition('open => closed', [
        animate('300ms ease-in')
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userData: any = null;
  user_data: any = null;
  isLoggedOut: boolean = false;
  serverResponse!: ServerResponse;
  private adminSubscription: Subscription | null = null;

  // Initialize subscriptions to null
  private authSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  private adminStatusSubscription: Subscription | null = null;

  // Declara isAdmin como BehaviorSubject para mantener su estado consistente
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    // Eliminamos la llamada a checkIfLoggedIn() del constructor
    // ya que podría ejecutarse demasiado pronto
  }

  ngOnInit(): void {
    // PRIMERO: Verificar el estado de autenticación actual de forma sincrónica
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isLoggedOut = !this.isAuthenticated;

    // Si el usuario está autenticado, cargar datos inmediatamente de forma proactiva
    if (this.isAuthenticated) {
      this.loadUserDataImmediately();
    }

    // DESPUÉS: Configurar suscripciones para actualizaciones futuras

    // Auth state subscription
    this.authSubscription = this.authService.authState$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      this.isLoggedOut = !isAuthenticated;

      // Check admin status when auth state changes
      if (isAuthenticated) {
        this.checkAdminStatus();
        if (!this.user_data) {
          this.loadUserData();
        }
      } else {
        // Reset admin status when logged out
        this.isAdminSubject.next(false);
        this.user_data = null;
        this.userData = null;
      }

      this.cdr.detectChanges();
    });

    // Suscripción a datos de usuario del AuthService
    this.authService.userData$.subscribe(userData => {
      if (userData) {
        this.userData = userData;
        this.user_data = userData;
      }
    });

    // User data subscription
    this.userSubscription = this.userService.userData$.subscribe(userData => {
      if (userData) {
        this.userData = userData;
        this.user_data = userData;
      }
    });

    // Admin status subscription
    this.adminSubscription = this.authService.isAdmin$.subscribe(isAdmin => {
      this.isAdminSubject.next(isAdmin);
      this.cdr.detectChanges();
    });

    // Initial checks
    this.checkIfLoggedIn();
    if (this.isAuthenticated) {
      this.checkAdminStatus();
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.adminStatusSubscription) {
      this.adminStatusSubscription.unsubscribe();
    }
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
    }
  }

  // Simplify the admin status check
  checkAdminStatus(): void {
    this.authService.checkAndUpdateAdminStatus().subscribe();
  }

  logout() {
    this.authService.logout().subscribe({
      next: (response: ServerResponse) => {
        this.user_data = null;
        this.userData = null;
        this.isLoggedOut = true;
        this.isAuthenticated = false;
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
      }
    });
  }

  checkIfLoggedIn(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isLoggedOut = !this.isAuthenticated;

    // If user is logged in but we don't have their data, load it
    if (this.isAuthenticated && !this.user_data) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (!this.isAuthenticated) {
      // No hay usuario autenticado, omitiendo carga de datos
      return;
    }

    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response && response.status === 'OK' && response.data) {
          // Manual update in addition to subscription
          this.userData = response.data;
          this.user_data = response.data;
          this.cdr.detectChanges();
        } else {
          console.warn("Respuesta incompleta del servidor:", response);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
      }
    });
  }

  // Método para cargar datos de usuario de forma INMEDIATA sin esperar callbacks
  loadUserDataImmediately(): void {
    // 1. Intentar obtener datos desde el servicio de auth (podrían ya estar en memoria)
    const currentUserData = this.authService.getCurrentUserData
      ? this.authService.getCurrentUserData()
      : null;

    if (currentUserData) {
      this.userData = currentUserData;
      this.user_data = currentUserData;
      this.cdr.detectChanges(); // Forzar actualización de la UI
    }

    // 2. Iniciar carga desde el servidor de forma proactiva
    this.userService.getUserProfile().subscribe({
      next: (response) => {
        if (response && response.status === 'OK' && response.data) {
          // La suscripción ya actualizará los datos, pero actualizamos manualmente también
          this.userData = response.data;
          this.user_data = response.data;
          this.cdr.detectChanges(); // Crucial: forzar actualización de la UI
        }
      },
      error: (error) => {
        console.error('Error cargando datos de usuario inmediatamente:', error);
      }
    });
  }

  // Variables para el menú de usuario
  isUserMenuOpen = false;
  menuVisible = false;
  closeMenuTimer: any = null;
  closeDelayTime = 100;

  // Variables para el dropdown de Explorar
  explorarMenuOpen = false;
  explorarMenuVisible = false;
  explorarCloseTimer: any = null;
  explorarCloseDelay = 100;

  // Variables para el menú móvil
  isMobileMenuOpen = false;
  isMobileMenuVisible = false;
  isMobileSubmenuOpen = false;
  isMobileUserMenuOpen = false;

  // Métodos para el menú de usuario (ya existentes)
  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation(); // Evita que el clic se propague
    this.isUserMenuOpen = !this.isUserMenuOpen;
    this.menuVisible = this.isUserMenuOpen;

    // Si cerramos el menú, asegúrate de que no queden efectos residuales
    if (!this.isUserMenuOpen) {
      // Resetear cualquier efecto visual o estado cuando se cierra
      // No es necesario hacer nada más ya que el ngClass se encargará
    }
  }

  closeUserMenu() {
    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
      setTimeout(() => {
        this.menuVisible = false;
      }, 250);
    }
  }

  startCloseTimer() {
    this.cancelCloseTimer();
    this.closeMenuTimer = setTimeout(() => {
      this.closeUserMenu();
    }, this.closeDelayTime);
  }

  cancelCloseTimer() {
    if (this.closeMenuTimer) {
      clearTimeout(this.closeMenuTimer);
      this.closeMenuTimer = null;
    }
  }

  // Métodos existentes para el dropdown de Explorar
  showExplorarMenu() {
    this.cancelExplorarCloseTimer();
    this.explorarMenuVisible = true;
    this.explorarMenuOpen = true;
  }

  hideExplorarMenu() {
    this.startExplorarCloseTimer();
  }

  closeExplorarMenu() {
    if (this.explorarMenuOpen) {
      this.explorarMenuOpen = false;
      setTimeout(() => {
        this.explorarMenuVisible = false;
      }, 250);
    }
  }

  startExplorarCloseTimer() {
    this.cancelExplorarCloseTimer();
    this.explorarCloseTimer = setTimeout(() => {
      this.closeExplorarMenu();
    }, this.explorarCloseDelay);
  }

  cancelExplorarCloseTimer() {
    if (this.explorarCloseTimer) {
      clearTimeout(this.explorarCloseTimer);
      this.explorarCloseTimer = null;
    }
  }

  // Nuevos métodos para el menú móvil
  toggleMobileMenu() {
    if (!this.isMobileMenuOpen) {
      this.isMobileMenuVisible = true;
      this.isMobileMenuOpen = true;
    } else {
      this.closeMobileMenu();
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.isMobileMenuVisible = false;
    this.isMobileUserMenuOpen = false; // También cerrar el menú de usuario
  }

  toggleMobileSubmenu() {
    this.isMobileSubmenuOpen = !this.isMobileSubmenuOpen;
  }

  toggleMobileUserMenu(event: Event): void {
    // Detener la propagación del evento para evitar cerrar accidentalmente menús padres
    event.stopPropagation();

    // Toggle del estado del menú de usuario móvil
    this.isMobileUserMenuOpen = !this.isMobileUserMenuOpen;

    // Si estamos abriendo el menú de usuario, cerrar otros menús relacionados
    if (this.isMobileUserMenuOpen) {
      // Cerrar el menú de explorar si está abierto
      this.explorarMenuOpen = false;
      this.explorarMenuVisible = false;

      // Cerrar el submenú si está abierto
      this.isMobileSubmenuOpen = false;

      // Cerrar el menú de admin si está abierto
      this.showAdminMenu = false;

      // Forzar la detección de cambios para actualizar la UI
      this.cdr.detectChanges();
    }

    // Aplicar efectos visuales al avatar
    // La clase profile-active se aplicará con [ngClass] en la plantilla

    // Añadir una animación sutil
    const profileElement = event.currentTarget as HTMLElement;
    if (profileElement && profileElement.parentElement) {
      if (this.isMobileUserMenuOpen) {
        // Pequeña animación de pulso cuando se abre
        profileElement.parentElement.classList.add('pulse-animation');

        // Quitar la clase después de la animación
        setTimeout(() => {
          if (profileElement && profileElement.parentElement) {
            profileElement.parentElement.classList.remove('pulse-animation');
          }
        }, 600);
      }
    }
  }

  // Para el menú móvil, agregar esta variable:
  showAdminMenu = false;

  // Método para alternar visibilidad del menú admin (para móvil)
  toggleAdminMenu(): void {
    this.showAdminMenu = !this.showAdminMenu;
  }

  // Añade getters para depuración
  get debugIsAdmin(): boolean {
    const value = this.isAdmin;
    return value;
  }

  // Use the BehaviorSubject for admin status
  get isAdmin(): boolean {
    return this.isAdminSubject.value;
  }

  // Cuando necesites actualizar el valor
  private setIsAdmin(value: boolean): void {
    if (this.isAdminSubject.value !== value) {
      this.isAdminSubject.next(value);
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  // Método para verificar correctamente si hay una imagen de perfil
  hasProfileImage(): boolean {
    // Esta implementación previene valores null, undefined o rutas vacías
    return Boolean(
      this.user_data &&
      this.user_data.image_path &&
      this.user_data.image_path.trim() !== '' &&
      !this.user_data.image_path.includes('undefined') &&
      !this.user_data.image_path.includes('null')
    );
  }

  // Método para manejar errores de carga de imagen
  handleImageError(event: Event): void {
    console.warn('Error cargando imagen de perfil', event);
    // Hacer que la imagen no se muestre
    if (this.user_data) {
      this.user_data.image_path = null;
      this.cdr.detectChanges();
    }
  }
}
