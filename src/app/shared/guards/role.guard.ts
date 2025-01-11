/**
 * @fileoverview Role-based access control guard for route protection
 * Implements authorization matrix from section 7.1.3 with comprehensive validation
 * @version 1.0.0
 * @license MIT
 */

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { UserRole, IUser } from '../models/user.model';

interface IRoleCache {
  [key: string]: {
    timestamp: number;
    result: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  // Cache duration for role checks (5 minutes)
  private readonly CACHE_DURATION = 300000;
  
  // Role validation cache to minimize repeated checks
  private readonly roleCache: IRoleCache = {};

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Validates if the current user has the required role(s) to access a route
   * Implements comprehensive role checking with caching and error handling
   * 
   * @param route - The route being accessed
   * @param state - Current router state
   * @returns Observable<boolean> - Access permission result
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Extract required roles from route data
    const requiredRoles: UserRole[] = route.data['roles'];

    // Validate route configuration
    if (!requiredRoles || !requiredRoles.length) {
      console.error('Route is missing required roles configuration');
      this.router.navigate(['/error'], { 
        queryParams: { 
          message: 'Invalid route configuration' 
        }
      });
      return of(false);
    }

    // Generate cache key for this route check
    const cacheKey = `${requiredRoles.join(',')}-${state.url}`;

    // Check cache for recent validation
    const cachedResult = this.getCachedValidation(cacheKey);
    if (cachedResult !== null) {
      return of(cachedResult);
    }

    // Perform role validation
    return this.authService.currentUser$.pipe(
      take(1),
      map((user: IUser | null) => {
        // Check if user is authenticated
        if (!user) {
          this.handleUnauthorizedAccess(state.url);
          return false;
        }

        // Validate user has required role
        const hasRequiredRole = requiredRoles.some(role => {
          switch (role) {
            case UserRole.ADMIN:
              return user.role === UserRole.ADMIN;
            case UserRole.CONTRACT_MANAGER:
              return user.role === UserRole.ADMIN || 
                     user.role === UserRole.CONTRACT_MANAGER;
            case UserRole.REVIEWER:
              return user.role === UserRole.ADMIN || 
                     user.role === UserRole.CONTRACT_MANAGER || 
                     user.role === UserRole.REVIEWER;
            case UserRole.BASIC_USER:
              return true; // All authenticated users have at least basic access
            default:
              return false;
          }
        });

        // Cache the validation result
        this.cacheValidation(cacheKey, hasRequiredRole);

        // Handle access denied
        if (!hasRequiredRole) {
          this.handleAccessDenied();
          return false;
        }

        return true;
      }),
      catchError(error => {
        console.error('Role validation error:', error);
        this.router.navigate(['/error'], { 
          queryParams: { 
            message: 'Authentication error' 
          }
        });
        return of(false);
      })
    );
  }

  /**
   * Handles unauthorized access attempts
   * @private
   * @param attemptedUrl - URL that was attempted to access
   */
  private handleUnauthorizedAccess(attemptedUrl: string): void {
    this.router.navigate(['/login'], { 
      queryParams: { 
        returnUrl: attemptedUrl 
      }
    });
  }

  /**
   * Handles access denied scenarios
   * @private
   */
  private handleAccessDenied(): void {
    this.router.navigate(['/access-denied']);
  }

  /**
   * Retrieves cached validation result if still valid
   * @private
   * @param key - Cache key for the validation
   * @returns boolean | null - Cached result or null if expired
   */
  private getCachedValidation(key: string): boolean | null {
    const cached = this.roleCache[key];
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.result;
    }
    return null;
  }

  /**
   * Caches a validation result
   * @private
   * @param key - Cache key for the validation
   * @param result - Validation result to cache
   */
  private cacheValidation(key: string, result: boolean): void {
    this.roleCache[key] = {
      timestamp: Date.now(),
      result
    };
  }
}