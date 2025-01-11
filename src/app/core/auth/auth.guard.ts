/**
 * @fileoverview Enhanced route guard implementing comprehensive authentication and role-based access control
 * with performance monitoring and detailed audit logging.
 * @version 1.0.0
 * @license MIT
 */

// @angular/core v15.0.0
import { Injectable } from '@angular/core';

// @angular/router v15.0.0
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

// rxjs v7.8.0
import { Observable, of } from 'rxjs';
import { map, take, catchError, finalize } from 'rxjs/operators';

// Internal imports
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../../shared/models/user.model';

/**
 * Enhanced route guard implementing comprehensive security features,
 * performance monitoring, and detailed audit logging.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  // Cache for role validation results to improve performance
  private roleCache: Map<string, boolean> = new Map();
  
  // Performance monitoring
  private guardExecutionTime: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  /**
   * Enhanced route activation guard with comprehensive security checks
   * @param route Route being activated
   * @param state Router state
   * @returns Observable<boolean> indicating if access is granted
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const startTime = performance.now();
    console.log('AuthGuard.canActivate - URL:', state.url);
    console.log('AuthGuard.canActivate - isAuthenticated:', this.authService.isAuthenticated);
    console.log('AuthGuard.canActivate - currentUser:', this.authService.currentUser);

    // Prevent infinite loops by checking if we're already on the login page
    if (state.url.startsWith('/auth/login')) {
      console.log('AuthGuard - On login page, allowing access');
      return of(true);
    }

    // If we're authenticated, allow access immediately
    if (this.authService.isAuthenticated) {
      const user = this.authService.currentUser;
      console.log('AuthGuard - User is authenticated:', user);

      // Check required roles if specified in route data
      const requiredRoles = route.data['roles'] as UserRole[];
      if (requiredRoles && requiredRoles.length > 0 && user) {
        console.log('AuthGuard - Required roles:', requiredRoles);
        console.log('AuthGuard - User role:', user.role);
        
        // Check if user's role matches any of the required roles
        const hasRequiredRole = requiredRoles.includes(user.role);

        if (!hasRequiredRole) {
          console.log('AuthGuard - Insufficient permissions');
          this.notificationService.showError('Insufficient permissions');
          return of(this.router.createUrlTree(['/dashboard']));
        }
      }
      
      console.log('AuthGuard - Access granted');
      return of(true);
    }

    // Not authenticated, redirect to login
    console.log('AuthGuard - Not authenticated, redirecting to login');
    this.notificationService.showError('Authentication required');
    const returnUrl = state.url === '/dashboard' ? null : state.url;
    return of(this.router.createUrlTree(['/auth/login'], 
      returnUrl ? { queryParams: { returnUrl } } : {}
    ));
  }

  /**
   * Enhanced child route guard with security inheritance
   * @param childRoute Child route being activated
   * @param state Router state
   * @returns Observable<boolean> indicating if access is granted
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.canActivate(childRoute, state);
  }

  /**
   * Enhanced role validation with hierarchical permissions
   * @param requiredRoles Roles required for access
   * @param userRoles User's current roles
   * @returns boolean indicating if user has required roles
   */
  private validateRoles(requiredRoles: UserRole[], userRoles: UserRole[]): boolean {
    // Generate cache key
    const cacheKey = `${requiredRoles.join(',')}_${userRoles.join(',')}`;
    
    // Check cache first
    if (this.roleCache.has(cacheKey)) {
      return this.roleCache.get(cacheKey)!;
    }

    // Implement role hierarchy checks
    const hasRequiredRole = requiredRoles.some(required => {
      switch (required) {
        case UserRole.BASIC_USER:
          return userRoles.some(role => Object.values(UserRole).includes(role));
        case UserRole.REVIEWER:
          return userRoles.some(role => 
            [UserRole.REVIEWER, UserRole.CONTRACT_MANAGER, UserRole.ADMIN].includes(role)
          );
        case UserRole.CONTRACT_MANAGER:
          return userRoles.some(role => 
            [UserRole.CONTRACT_MANAGER, UserRole.ADMIN].includes(role)
          );
        case UserRole.ADMIN:
          return userRoles.includes(UserRole.ADMIN);
        default:
          return false;
      }
    });

    // Cache the result
    this.roleCache.set(cacheKey, hasRequiredRole);
    
    return hasRequiredRole;
  }
}