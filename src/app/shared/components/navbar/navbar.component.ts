/**
 * @fileoverview Enhanced navigation bar component with theme switching and user management
 * Implements modern design system specifications and accessibility requirements
 * @version 2.0.0
 */

import { Component, OnInit, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { IUser } from '@shared/models/user.model';

// Material Imports
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ]
})
export class NavbarComponent implements OnInit {
  @Input() currentUser: IUser | null = null;
  @Input() isDarkTheme = false;
  
  currentUser$: Observable<IUser | null>;
  isDarkTheme$: Observable<boolean>;
  isScrolled = false;
  isMenuOpen$ = new BehaviorSubject<boolean>(false);
  isLoginPage = false;

  constructor(
    public router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isDarkTheme$ = this.themeService.isDarkTheme$;

    // Subscribe to router events to detect login page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage = event.url.includes('/auth/login');
      if (this.isLoginPage) {
        this.isMenuOpen$.next(false);
      }
    });
  }

  ngOnInit(): void {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 20;
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMenu(): void {
    this.isMenuOpen$.next(!this.isMenuOpen$.value);
  }

  closeMenu(): void {
    this.isMenuOpen$.next(false);
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout().subscribe();
  }
}