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
        transform: 'translateY(-20px)',
        display: 'none'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0)',
        display: 'block'
      })),
      transition('closed => open', [
        style({ display: 'block' }),
        animate('200ms ease-out')
      ]),
      transition('open => closed', [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-20px)'
        })),
        style({ display: 'none' })
      ])
    ]),
    trigger('dropdownAnimation', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-20px) scale(0.95)',
        height: 0,
        overflow: 'hidden'
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
        maxHeight: '500px' // altura máxima suficiente para el contenido
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
  private adminStatusSubscription: Subscription | null = null; // Nueva suscripción

  // Declara isAdmin como BehaviorSubject para mantener su estado consistente
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.checkIfLoggedIn();
  }

  ngOnInit(): void {
    console.log("Header ngOnInit - isAdmin inicial:", this.isAdmin);

    // Suscripción existente a cambios de autenticación
    this.authSubscription = this.authService.authState$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
      this.isLoggedOut = !isAuthenticated;

      if (isAuthenticated) {
        this.loadUserData();
        this.checkAdminStatus(); // Verificar si es admin cuando está autenticado
      } else {
        this.userData = null;
        this.user_data = null;
        this.setIsAdmin(false); // Resetear estado de admin al cerrar sesión
      }
    });

    // Suscripción existente a cambios de datos de usuario
    this.userSubscription = this.userService.userData$.subscribe(userData => {
      if (userData) {
        this.user_data = {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          image_path: userData.image_path,
          role: userData.role // Asegurarnos de capturar el rol
        };
        this.userData = this.user_data;

        // Actualizar estado de admin basado en el rol del usuario
        this.setIsAdmin(userData.role === 'admin');
      }
    });

    // Verificación inicial
    this.checkIfLoggedIn();
    if (this.isAuthenticated) {
      this.checkAdminStatus();
    }

    // Suscribirse al observable de admin
    this.adminSubscription = this.authService.isAdmin$.subscribe(isAdmin => {
      console.log("Header recibió actualización de admin:", isAdmin, "anterior:", this.isAdmin);

      // Usar el método setter en lugar de asignar directamente
      this.setIsAdmin(isAdmin);

      console.log("Header isAdmin después de actualizar:", this.isAdmin);
    });

    // Verificar el estado inicial de admin
    this.checkAdminStatus();
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

  // Nuevo método para verificar si el usuario es administrador
  // Añadir logs para depuración
  checkAdminStatus(): void {
    // Este método solo inicializa la verificación
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
    if (this.isAuthenticated) {
      this.userDataInint();
      if (!this.user_data) {
        this.loadUserData();
      }
    }
  }

  userDataInint() {
    const data = localStorage.getItem('user_data');
    if (data) {
      this.user_data = JSON.parse(data);
      this.userData = this.user_data; // Keep both user data properties in sync
    }
  }

  loadUserData(): void {
    if (this.isAuthenticated) {
      this.userService.getUserProfile().subscribe({
        next: () => {
          // Data is updated automatically through the subscription
        },
        error: (error) => {
          console.error('Error al cargar datos del usuario:', error);
        }
      });
    }
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
  toggleUserMenu(event: Event) {
    event.stopPropagation();

    if (!this.isUserMenuOpen) {
      this.cancelCloseTimer();
      this.menuVisible = true;
      this.isUserMenuOpen = true;
    } else {
      this.closeUserMenu();
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
    event.stopPropagation(); // Evitar que el evento se propague al padre
    this.isMobileUserMenuOpen = !this.isMobileUserMenuOpen;
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
    console.log("GETTER debugIsAdmin llamado:", value);
    return value;
  }

  // Modifica el getter para usar el BehaviorSubject
  get isAdmin(): boolean {
    return this.isAdminSubject.value;
  }

  // Cuando necesites actualizar el valor
  private setIsAdmin(value: boolean): void {
    if (this.isAdminSubject.value !== value) {
      console.log("Actualizando isAdmin a:", value);
      this.isAdminSubject.next(value);
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
