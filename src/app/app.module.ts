/**
 * @fileoverview Root module configuration for the Contract Processing System.
 * Implements comprehensive NgRx store setup, module organization, and core service integration.
 * @version 1.0.0
 * @license MIT
 */

// Angular Core - v15.0.0
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';

// NgRx Store - v15.0.0
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

// Translation
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Internal Modules
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

// Components
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
// import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingComponent } from './shared/components/loading/loading.component';

// Store Configuration
import { poReducer } from './store/reducers/po.reducer';
import { activityReducer } from './store/reducers/activity.reducer';
import { PurchaseOrderEffects } from './store/effects/po.effects';
import { ActivityEffects } from './store/effects/activity.effects';

// Environment Configuration
import { environment } from '../environments/environment';
import { AuthInterceptor } from './core/auth/auth.interceptor';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  // Use absolute path and bypass API interceptor by using HttpClient directly
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

/**
 * Root module that bootstraps and configures the Contract Processing System.
 * Implements comprehensive module organization, state management, and core service integration.
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    // Angular Core
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // Translation
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

    // Feature Modules
    AppRoutingModule,
    CoreModule,
    SharedModule,

    // Standalone Components
    LoadingComponent,
    NavbarComponent,

    // NgRx Store Configuration
    StoreModule.forRoot({
      purchaseOrders: poReducer,
      activity: activityReducer,
    }),

    // NgRx Effects Configuration
    EffectsModule.forRoot([PurchaseOrderEffects, ActivityEffects]),

    // Development Tools Configuration
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerImmediately',
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  /**
   * Module version for tracking and debugging
   */
  public static readonly VERSION = '1.0.0';

  constructor() {
    if (!environment.production) {
      console.log(`AppModule initialized with version ${AppModule.VERSION}`);
    }
  }
}
