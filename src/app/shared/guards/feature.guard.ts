/**
 * @fileoverview Enhanced Angular route guard implementing feature-based access control
 * with caching, error handling, and audit logging capabilities.
 * @version 1.0.0
 * @license MIT
 */

import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  Router 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { 
  map, 
  take, 
  catchError 
} from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

interface FeatureCacheEntry {
  value: boolean;
  timestamp: number;
}

/**
 * Enhanced route guard that implements feature-based access control
 * with caching, error handling, and audit logging capabilities.
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureGuard implements CanActivate {
  private featureCache: Map<string, FeatureCacheEntry> = new Map();
  private readonly CACHE_DURATION_MS = 5000; // 5 seconds cache duration
  private readonly ERROR_REDIRECT_URL = '/error';
  private readonly UNAUTHORIZED_REDIRECT_URL = '/unauthorized';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Enhanced route guard that checks feature flags with caching and error handling
   * @param route Current route snapshot
   * @returns Observable<boolean> indicating if access is granted
   */
  canActivate(
    route: ActivatedRouteSnapshot,
  ): Observable<boolean> {
    // Get required feature from route data
    const requiredFeature = route.data['requiredFeature'];
    if (!requiredFeature) {
      console.error('Feature guard: No required feature specified in route data');
      this.router.navigate([this.ERROR_REDIRECT_URL]);
      return of(false);
    }

    // Check authentication first
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate([this.UNAUTHORIZED_REDIRECT_URL]);
          return false;
        }
        return true;
      }),
      map(isAuthenticated => {
        if (!isAuthenticated) return false;
        
        // Check feature cache first
        const cachedFeature = this.getCachedFeature(requiredFeature);
        if (cachedFeature !== null) {
          this.logAccess(requiredFeature, cachedFeature, true);
          return cachedFeature;
        }

        // If not cached, check feature flags from environment
        const isEnabled = this.checkFeatureFlag(requiredFeature);
        this.cacheFeature(requiredFeature, isEnabled);
        this.logAccess(requiredFeature, isEnabled, false);

        if (!isEnabled) {
          this.router.navigate([this.UNAUTHORIZED_REDIRECT_URL]);
        }

        return isEnabled;
      }),
      catchError(error => {
        console.error('Feature guard error:', error);
        this.router.navigate([this.ERROR_REDIRECT_URL]);
        return of(false);
      })
    );
  }

  /**
   * Checks if a specific feature is enabled with caching support
   * @param featureName Name of the feature to check
   * @returns Observable<boolean> indicating if feature is enabled
   */
  public isFeatureEnabled(featureName: string): Observable<boolean> {
    if (!featureName) {
      console.error('Feature guard: No feature name provided');
      return of(false);
    }

    // Check cache first
    const cachedFeature = this.getCachedFeature(featureName);
    if (cachedFeature !== null) {
      return of(cachedFeature);
    }

    // If not cached, check feature flags
    const isEnabled = this.checkFeatureFlag(featureName);
    this.cacheFeature(featureName, isEnabled);
    
    return of(isEnabled);
  }

  /**
   * Retrieves cached feature status if valid
   * @private
   * @param featureName Name of the feature to retrieve
   * @returns boolean | null Cached value or null if invalid/missing
   */
  private getCachedFeature(featureName: string): boolean | null {
    const cached = this.featureCache.get(featureName);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION_MS;
    if (isExpired) {
      this.featureCache.delete(featureName);
      return null;
    }

    return cached.value;
  }

  /**
   * Caches feature status with timestamp
   * @private
   * @param featureName Name of the feature to cache
   * @param isEnabled Feature enabled status
   */
  private cacheFeature(featureName: string, isEnabled: boolean): void {
    this.featureCache.set(featureName, {
      value: isEnabled,
      timestamp: Date.now()
    });
  }

  /**
   * Checks feature flag status from environment configuration
   * @private
   * @param featureName Name of the feature to check
   * @returns boolean indicating if feature is enabled
   */
  private checkFeatureFlag(featureName: string): boolean {
    const features = environment.features as Record<string, boolean>;
    return features[featureName] ?? false;
  }

  /**
   * Logs feature access attempts for audit purposes
   * @private
   * @param featureName Name of the accessed feature
   * @param isEnabled Whether access was granted
   * @param fromCache Whether the decision was from cache
   */
  private logAccess(
    featureName: string, 
    isEnabled: boolean, 
    fromCache: boolean
  ): void {
    if (environment.logging.enableConsole) {
      console.log(
        `Feature access attempt: ${featureName}`,
        `Access ${isEnabled ? 'granted' : 'denied'}`,
        `Source: ${fromCache ? 'cache' : 'direct check'}`
      );
    }
  }
}