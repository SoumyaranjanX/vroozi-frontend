// @angular/core v15.0.0
import { Injectable, ErrorHandler } from '@angular/core';

// @angular/common/http v15.0.0
import { HttpErrorResponse } from '@angular/common/http';

// rxjs v7.8.0
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// @ngx-translate/core v14.0.0
import { TranslateService } from '@ngx-translate/core';

// Internal imports
import { NotificationService } from '../../core/services/notification.service';

/**
 * Interface for field-level validation errors
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Service that provides centralized error handling functionality for the application.
 * Implements comprehensive error processing, formatting, logging, and notification display.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  constructor(
    private notificationService: NotificationService,
    private translateService: TranslateService
  ) {}

  /**
   * Implementation of Angular's ErrorHandler interface
   * Handles all uncaught errors in the application
   */
  handleError(error: Error | HttpErrorResponse): void {
    let formattedMessage = 'An error occurred';

    if (error instanceof HttpErrorResponse) {
      // Handle HTTP errors
      formattedMessage = this.formatHttpError(error);
    } else {
      // Handle other errors
      formattedMessage = this.formatError(error);
    }

    // Show error notification
    this.notificationService.showError(formattedMessage);

    // Log error for debugging
    console.error('Application Error:', error);
  }

  /**
   * Format HTTP errors with proper error messages
   */
  private formatHttpError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return this.translateService.instant('ERROR.CLIENT_SIDE', { message: error.error.message });
    }

    // Server-side error
    switch (error.status) {
      case 400:
        return this.handleValidationError(error);
      case 401:
        return this.translateService.instant('ERROR.UNAUTHORIZED');
      case 403:
        return this.translateService.instant('ERROR.FORBIDDEN');
      case 404:
        return this.translateService.instant('ERROR.NOT_FOUND');
      case 500:
        return this.translateService.instant('ERROR.SERVER_ERROR');
      default:
        return this.translateService.instant('ERROR.UNKNOWN', { status: error.status });
    }
  }

  /**
   * Format general application errors
   */
  private formatError(error: Error): string {
    return this.translateService.instant('ERROR.GENERAL', { message: error.message });
  }

  /**
   * Handle validation errors from the backend
   */
  private handleValidationError(error: HttpErrorResponse): string {
    if (error.error?.errors) {
      const validationErrors = error.error.errors as ValidationError[];
      return validationErrors
        .map(err => `${err.field}: ${err.message}`)
        .join('\n');
    }
    return this.translateService.instant('ERROR.VALIDATION');
  }
}