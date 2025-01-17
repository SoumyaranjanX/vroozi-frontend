// @angular/core v15.0.0
import { Injectable } from '@angular/core';

// @angular/common/http v15.0.0
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';

// rxjs v7.8.0
import { Observable, throwError, timer } from 'rxjs';
import { 
  catchError, 
  finalize, 
  timeout, 
  retry, 
  tap 
} from 'rxjs/operators';

// Internal imports
import { environment } from '../../../environments/environment';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth/auth.service';

/**
 * Comprehensive HTTP interceptor that handles API request/response pipeline
 * with security measures, error handling, and performance monitoring.
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private readonly apiUrl: string = environment.apiUrl;
  private readonly defaultTimeout: number = 30000; // 30 seconds
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  // Pattern to detect external URLs
  private readonly externalUrlPattern = new RegExp('^https?://');

  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Intercepts HTTP requests and implements comprehensive request/response pipeline
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Start loading indicator
    this.loadingService.show();

    // Add request timestamp for performance tracking
    const startTime = Date.now();

    // Clone the request to modify
    let modifiedRequest = request.clone();

    // Special handling for auth endpoints
    if (request.url.includes('/auth/')) {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      // Add auth token for logout endpoint
      if (request.url.includes('/auth/logout')) {
        const token = this.authService.getToken();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
      }

      modifiedRequest = request.clone({
        headers: headers,
        withCredentials: false
      });
    } 
    // Add base URL for internal requests
    else if (!this.isExternalRequest(request.url)) {
      modifiedRequest = request.clone({
        url: request.url.startsWith('/') ? request.url : `/${request.url}`,
        headers: this.getSecureHeaders(request.headers),
        withCredentials: false
      });

      // Add auth token if available
      const token = this.authService.getToken();
      if (token) {
        modifiedRequest = modifiedRequest.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    return next.handle(modifiedRequest).pipe(
      // Add timeout to prevent hanging requests
      timeout(this.defaultTimeout),

      // Add retry logic for failed requests
      retry({
        count: this.maxRetries,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Only retry for specific error codes and if it's not a POST/PUT/DELETE
          if (
            error.status === 0 || // Network errors
            error.status === 408 || // Timeout
            error.status === 429 || // Rate limiting
            error.status >= 500 // Server errors
          ) {
            if (request.method === 'GET') {
              return timer(retryCount * this.retryDelay);
            }
          }
          return throwError(() => error);
        }
      }),

      // Track request completion time
      tap({
        next: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.debug(`Request completed in ${duration}ms`, {
            url: modifiedRequest.url,
            method: modifiedRequest.method,
            duration
          });
        }
      }),

      // Handle errors
      catchError((error: HttpErrorResponse) => this.handleError(error)),

      // Clean up loading state
      finalize(() => {
        this.loadingService.hide();
      })
    );
  }

  /**
   * Handles HTTP errors and shows appropriate notifications
   * @param error The HTTP error response
   * @returns An observable with the error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request: ' + this.extractErrorMessage(error);
          break;
        case 401:
          // Check if it's a token expiration error
          if (error.error?.detail?.includes('expired') || error.error?.message?.includes('expired')) {
            this.authService.handleTokenExpiration();
            return throwError(() => error);
          }
          // For other unauthorized errors, force logout
          errorMessage = 'Unauthorized: Please log in again';
          this.authService.handleSessionExpired();
          break;
        case 403:
          errorMessage = 'Access Denied: Insufficient permissions';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 422:
          errorMessage = 'Validation Error: ' + this.extractErrorMessage(error);
          break;
        case 500:
          errorMessage = 'Server Error: Please try again later';
          break;
        default:
          errorMessage = `Error ${error.status}: ${this.extractErrorMessage(error)}`;
      }
    }

    // Show notification to user except for token expiration which is handled separately
    if (!(error.status === 401 && (error.error?.detail?.includes('expired') || error.error?.message?.includes('expired')))) {
      this.notificationService.showError(errorMessage);
    }

    // Return the error for further handling
    return throwError(() => error);
  }

  /**
   * Extracts error message from HTTP error response
   * @param error The HTTP error response
   * @returns The extracted error message
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.error) {
      return error.error.error;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }
    return error.message || 'Unknown error occurred';
  }

  /**
   * Determines if a request is to an external URL
   */
  private isExternalRequest(url: string): boolean {
    // Skip API interceptor for external URLs and translation files
    return this.externalUrlPattern.test(url) || url.includes('assets/i18n/');
  }

  /**
   * Adds secure headers to requests
   */
  private getSecureHeaders(existingHeaders: HttpHeaders): HttpHeaders {
    let headers = existingHeaders || new HttpHeaders();

    // Add common headers
    headers = headers
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      headers = headers.set('X-CSRF-Token', csrfToken);
    }

    return headers;
  }
}