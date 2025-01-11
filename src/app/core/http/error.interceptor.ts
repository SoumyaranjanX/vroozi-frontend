// @angular/core v15.0.0
import { Injectable } from '@angular/core';

// @angular/common/http v15.0.0
import { 
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';

// rxjs v7.8.0
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// Internal imports
import { ErrorHandlerService } from '../../shared/services/error-handler.service';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP interceptor that provides global error handling with enhanced security,
 * accessibility, and internationalization support.
 * 
 * Implements standardized error handling, loading state management, and user
 * notifications following enterprise security and accessibility guidelines.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  // Track active requests to manage loading state
  private activeRequests = 0;

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private loadingService: LoadingService
  ) {}

  /**
   * Intercepts HTTP requests and handles errors with proper security,
   * accessibility, and internationalization support.
   * 
   * @param request - The outgoing HTTP request
   * @param next - The next handler in the chain
   * @returns Observable of HTTP events with error handling
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Increment active requests counter
    this.activeRequests++;
    
    // Show loading indicator for first active request
    if (this.activeRequests === 1) {
      this.loadingService.show();
    }

    return next.handle(request).pipe(
      // Monitor successful responses
      tap({
        error: (error: HttpErrorResponse) => {
          // Log all errors for monitoring
          console.error(
            `[ErrorInterceptor] Error occurred while handling request to ${request.url}:`,
            error
          );
        }
      }),

      // Handle errors
      catchError((error: HttpErrorResponse) => {
        // Use error handler service to process the error
        this.errorHandlerService.handleError(error);
        // Return a new error Observable to be handled by the caller
        return throwError(() => error);
      }),

      // Cleanup after request completes (success or error)
      finalize(() => {
        // Decrement active requests counter
        this.activeRequests--;
        
        // Hide loading indicator when all requests complete
        if (this.activeRequests === 0) {
          // Add small delay to prevent flickering for quick responses
          setTimeout(() => {
            this.loadingService.hide();
          }, 100);
        }
      })
    );
  }
}