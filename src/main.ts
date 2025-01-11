/**
 * @fileoverview Enterprise-grade entry point for the Contract Processing System Angular application.
 * Implements comprehensive error handling, performance monitoring, and environment-specific configurations.
 * @version 1.0.0
 * @license MIT
 */

// @angular/core v15.0.0
import { enableProdMode } from '@angular/core';

// @angular/platform-browser-dynamic v15.0.0
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// rxjs v7.8.0
import { from } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

// Internal imports
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Constants for bootstrap configuration
const BOOTSTRAP_RETRY_ATTEMPTS = 3;
const BOOTSTRAP_RETRY_DELAY = 1000;

/**
 * Validates environment configuration before bootstrapping
 * @returns boolean indicating if environment is valid
 * @throws Error if environment configuration is invalid
 */
function validateEnvironment(): boolean {
  if (!environment) {
    throw new Error('Environment configuration is missing');
  }

  // Validate API URL
  if (!environment.apiUrl || !environment.apiUrl.startsWith('http')) {
    throw new Error('Invalid API URL configuration');
  }

  // Validate rate limiting configuration
  if (!environment.apiRateLimit || environment.apiRateLimit.requestsPerMinute <= 0) {
    throw new Error('Invalid rate limiting configuration');
  }

  // Validate file upload configuration
  if (!environment.fileConfig || !environment.fileConfig.supportedFileTypes) {
    throw new Error('Invalid file upload configuration');
  }

  // Validate security configuration
  if (!environment.security || typeof environment.security.enableCSP !== 'boolean') {
    throw new Error('Invalid security configuration');
  }

  return true;
}

/**
 * Bootstraps the Angular application with comprehensive error handling and performance monitoring
 */
async function bootstrapApplication(): Promise<void> {
  const startTime = performance.now();

  try {
    // Validate environment configuration
    validateEnvironment();

    // Enable production mode if specified
    if (environment.production) {
      enableProdMode();
    }

    // Configure performance monitoring
    if (environment.features.enablePerformanceMonitoring) {
      performance.mark('bootstrap-start');
    }

    // Bootstrap the application with retry logic
    await from(platformBrowserDynamic().bootstrapModule(AppModule))
      .pipe(
        retry({
          count: BOOTSTRAP_RETRY_ATTEMPTS,
          delay: BOOTSTRAP_RETRY_DELAY
        }),
        catchError((error: Error) => {
          console.error('Application bootstrap failed:', error);
          // Log to monitoring system in production
          if (environment.production) {
            // TODO: Implement production error logging
          }
          throw error;
        })
      )
      .toPromise();

    // Record bootstrap completion metrics
    if (environment.features.enablePerformanceMonitoring) {
      performance.mark('bootstrap-end');
      performance.measure('bootstrap-duration', 'bootstrap-start', 'bootstrap-end');
      
      const bootstrapDuration = performance.now() - startTime;
      console.debug(`Application bootstrap completed in ${bootstrapDuration.toFixed(2)}ms`);
    }

  } catch (error) {
    console.error('Fatal error during application bootstrap:', error);
    
    // Display user-friendly error message
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      background-color: #fff;
      border: 1px solid #dc3545;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    errorContainer.innerHTML = `
      <h2 style="color: #dc3545; margin-bottom: 10px;">Application Error</h2>
      <p>We apologize, but the application failed to start. Please try refreshing the page.</p>
    `;
    document.body.appendChild(errorContainer);

    // Re-throw error for global error handler
    throw error;
  }
}

// Initialize the application
if (document.readyState === 'complete') {
  bootstrapApplication();
} else {
  document.addEventListener('DOMContentLoaded', bootstrapApplication);
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener('error', (event: ErrorEvent) => {
  console.error('Uncaught error:', event.error);
  event.preventDefault();
});