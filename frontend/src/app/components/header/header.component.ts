import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

  constructor(
    private _auth: AuthService,
    private router: Router,
    private userService: UserService
  ) {
    this.checkIfLoggedIn();
  }

  ngOnInit(): void {
    this.checkIfLoggedIn();

    // Suscribirse a cambios en los datos del usuario
    if (!this.isLoggedOut) {
      this.userSubscription = this.userService.userData$.subscribe(userData => {
        if (userData) {
          this.user_data = {
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            image_path: userData.image_path
          };
        }
      });

      // Cargar datos del usuario al inicio
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  user_data: any = null;
  isLoggedOut: boolean = false;
  serverResponse!: ServerResponse;
  private userSubscription: Subscription | null = null;

  logout(){
    this._auth.logout().subscribe({
      next: (response: ServerResponse) => {
        this.user_data = null;
        this.isLoggedOut = true;
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión:', err);
      }
    });
  }

  checkIfLoggedIn(): void {
    this.isLoggedOut = !this._auth.isAuthenticated();

    // Si el usuario está logueado pero no tenemos sus datos, cargarlos
    if (!this.isLoggedOut && !this.user_data) {
      this.loadUserData();
    }
  }

  userDataInint(){
    const data = localStorage.getItem('user_data');
    this.user_data = data ? JSON.parse(data) : null;
  }

  // Método para cargar datos del usuario, incluyendo imagen de perfil
  loadUserData(): void {
    this.userService.getUserProfile().subscribe({
      next: () => {
        // Los datos se actualizan automáticamente a través de la suscripción
      },
      error: (error) => {
        console.error('Error al cargar datos del usuario:', error);
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
}
