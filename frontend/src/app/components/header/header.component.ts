import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import ServerResponse from 'src/app/interfaces/ServerResponse';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('userMenuAnimation', [
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
export class HeaderComponent {

  constructor(private _auth: AuthService, private router: Router){
    this.checkIfLoggedIn();
  }
  user_data: { first_name: string, last_name: string, email: string } | null = null;
  isLoggedOut: boolean = false;
  serverResponse!: ServerResponse;
  // TODO reemplazar apartado perfil por boton de login cuando no este logueado
  logout(){
    this._auth.logout().subscribe({
      next: (response: ServerResponse) => {
        this.serverResponse = response;
        localStorage.removeItem('user_data');
        this.isLoggedOut = true
        this.checkIfLoggedIn();
      },
      error: (err) => {
        this.serverResponse = {"status": "ERROR", "message": err}
      }
    });
  }

  checkIfLoggedIn() {
    this.isLoggedOut = !this._auth.isAuthenticated();
  }

  userDataInint(){
    const data = localStorage.getItem('user_data');
    this.user_data = data ? JSON.parse(data) : null;
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

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    setTimeout(() => {
      this.isMobileMenuVisible = false;
      this.isMobileSubmenuOpen = false;
      this.isMobileUserMenuOpen = false; // Cierra también el menú de usuario
    }, 300);
  }

  toggleMobileSubmenu() {
    this.isMobileSubmenuOpen = !this.isMobileSubmenuOpen;
  }

  toggleMobileUserMenu(event: Event) {
    event.stopPropagation();
    this.isMobileUserMenuOpen = !this.isMobileUserMenuOpen;
  }
}
