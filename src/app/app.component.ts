// @angular/core v15.0.0
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/services/theme.service';
import { IUser } from './shared/models/user.model';

/**
 * @fileoverview Root component of the application that implements the main layout structure
 * and manages application-wide concerns like theme switching and loading states.
 * Implements OnPush change detection for optimal performance.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentUser$: Observable<IUser | null>;
  currentTheme$: Observable<boolean>;
  isLoading = false;
  loadingMessage = '';
  accessibilityAnnouncement = '';

  constructor(
    public router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.currentTheme$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    // Initialize any necessary services or state
  }

  onRouteActivate(): void {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }
}