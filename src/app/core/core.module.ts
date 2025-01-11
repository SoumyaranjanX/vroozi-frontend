/**
 * @fileoverview Core module providing essential services and functionality for the Contract Processing System.
 * Implements singleton pattern and provides application-wide services for authentication, HTTP interception,
 * loading states, and notifications.
 * @version 1.0.0
 * @license MIT
 */

// @angular/core v15.0.0
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

// Internal service imports
import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notification.service';
import { AuthService } from './auth/auth.service';

// HTTP interceptors
import { ApiInterceptor } from './http/api.interceptor';
import { AuthInterceptor } from './auth/auth.interceptor';

/**
 * Core module that provides singleton services and essential functionality
 * for the Contract Processing System. This module should only be imported
 * in the AppModule to ensure single instances of services.
 *
 * Features:
 * - Authentication and authorization management
 * - HTTP request/response pipeline
 * - Loading state management
 * - System-wide notifications
 * - Security monitoring and error handling
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    // HTTP interceptors in order of execution
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    },
    // Core services
    LoadingService,
    NotificationService,
    AuthService
  ]
})
export class CoreModule {
  // Flag to track if module has been imported
  private static isModuleLoaded = false;

  /**
   * Constructor that enforces singleton pattern by preventing
   * multiple imports of CoreModule.
   * 
   * @param parentModule Optional reference to CoreModule if it exists
   * @throws Error if CoreModule is imported more than once
   */
  constructor(
    @Optional() @SkipSelf() parentModule?: CoreModule
  ) {
    if (parentModule || CoreModule.isModuleLoaded) {
      throw new Error(
        'CoreModule is already loaded. Import it only in AppModule.'
      );
    }
    CoreModule.isModuleLoaded = true;
  }
}