/**
 * @fileoverview Enhanced HTTP interceptor implementing secure authentication token management,
 * automatic token refresh, and request validation for the Contract Processing System.
 * @version 1.0.0
 * @license MIT
 */

import { Injectable } from '@angular/core'; // @angular/core ^15.0.0
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http'; // @angular/common/http ^15.0.0
import { 
  Observable, 
  throwError, 
  BehaviorSubject, 
  timer 
} from 'rxjs'; // rxjs ^7.8.0
import { 
  catchError, 
  switchMap, 
  filter, 
  take, 
  finalize, 
  timeout,
  retry,
  mergeMap
} from 'rxjs/operators'; // rxjs/operators ^7.8.0

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly REQUEST_TIMEOUT_MS = 30000; // 30 second timeout
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(private authService: AuthService) {}

  /**
   * Intercepts HTTP requests to add authentication, handle token refresh, and implement security measures
   * @param request The outgoing HTTP request
   * @param next The HTTP handler for the request chain
   * @returns Observable<HttpEvent<any>> The modified request with security enhancements
   */
  intercept(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Skip auth header for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add auth header
    const token = this.authService.getToken();
    if (token) {
      // Check if this is a FormData request
      if (request.body instanceof FormData) {
        // For FormData, only add Authorization header
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // For other requests, add all headers
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        });
      }
    }

    return next.handle(request).pipe(
      timeout(this.REQUEST_TIMEOUT_MS),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Handles 401 Unauthorized errors with token refresh logic
   * @param request The failed HTTP request
   * @param next The HTTP handler
   * @returns Observable<HttpEvent<any>> The retried request with new token
   * @private
   */
  private handle401Error(
    request: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const token = this.authService.getToken();
      if (token) {
        return this.authService.refreshToken(token).pipe(
          switchMap((response) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.accessToken);
            
            // Clone request with new token
            const clonedRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${response.accessToken}`,
                ...(!(request.body instanceof FormData) && {
                  'Content-Type': 'application/json'
                }),
                Accept: 'application/json'
              }
            });
            
            return next.handle(clonedRequest);
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => error);
          }),
          finalize(() => {
            this.isRefreshing = false;
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        // Clone request with new token
        const clonedRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            ...(!(request.body instanceof FormData) && {
              'Content-Type': 'application/json'
            }),
            Accept: 'application/json'
          }
        });
        return next.handle(clonedRequest);
      })
    );
  }

  /**
   * Checks if the request URL is an authentication endpoint
   * @param url The request URL
   * @returns boolean True if the URL is an auth endpoint
   * @private
   */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email'
    ];
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Generates a unique request ID for tracing
   * @returns string The generated request ID
   * @private
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}