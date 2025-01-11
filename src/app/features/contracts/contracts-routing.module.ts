// @angular/core v15.0.0
import { NgModule } from '@angular/core';

// @angular/router v15.0.0
import { RouterModule, Routes, Router, NavigationEnd } from '@angular/router';

// Internal imports
import { ContractListComponent } from './components/contract-list/contract-list.component';
import { ContractUploadComponent } from './components/contract-upload/contract-upload.component';
import { ContractValidationComponent } from './components/contract-validation/contract-validation.component';
import { ContractViewComponent } from './components/contract-view/contract-view.component';
import { AuthGuard } from '@core/auth/auth.guard';
import { UserRole } from '@shared/models/user.model';

/**
 * Routes configuration for the contracts feature module
 * Implements role-based access control and accessibility enhancements
 */
const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: {
      roles: [
        UserRole.ADMIN,
        UserRole.CONTRACT_MANAGER,
        UserRole.REVIEWER
      ],
      breadcrumb: 'Contracts',
      analytics: {
        pageType: 'contracts',
        trackingEnabled: true
      },
      accessibility: {
        landmark: 'main',
        announcePageChange: true,
        focusTarget: 'h1',
        skipLink: 'mainContent'
      }
    },
    children: [
      {
        path: '',
        component: ContractListComponent,
        data: {
          title: 'Contract List',
          roles: [
            UserRole.ADMIN,
            UserRole.CONTRACT_MANAGER,
            UserRole.REVIEWER
          ],
          accessibility: {
            landmark: 'region',
            label: 'Contract List'
          }
        }
      },
      {
        path: 'upload',
        component: ContractUploadComponent,
        data: {
          title: 'Upload Contract',
          roles: [
            UserRole.ADMIN,
            UserRole.CONTRACT_MANAGER
          ],
          accessibility: {
            landmark: 'form',
            label: 'Contract Upload Form'
          }
        }
      },
      {
        path: ':id/validate',
        component: ContractValidationComponent,
        data: {
          title: 'Validate Contract',
          roles: [
            UserRole.ADMIN,
            UserRole.CONTRACT_MANAGER
          ],
          accessibility: {
            landmark: 'form',
            label: 'Contract Validation Form'
          }
        }
      },
      {
        path: ':id/view',
        component: ContractViewComponent,
        data: {
          title: 'View Contract',
          roles: [
            UserRole.ADMIN,
            UserRole.CONTRACT_MANAGER,
            UserRole.REVIEWER
          ],
          accessibility: {
            landmark: 'region',
            label: 'Contract Details View'
          }
        }
      }
    ]
  }
];

/**
 * Contracts routing module that provides enhanced navigation configuration
 * with role-based security, analytics tracking, and accessibility features
 */
@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class ContractsRoutingModule {
  constructor(private router: Router) {
    // Initialize route change monitoring for analytics and accessibility
    this.initializeRouteMonitoring();
  }

  /**
   * Sets up route change monitoring for analytics and accessibility announcements
   * @private
   */
  private initializeRouteMonitoring(): void {
    this.router.events.subscribe((event: unknown) => {
      if (event instanceof NavigationEnd) {
        // Track page view in analytics
        if (event.url.startsWith('/contracts')) {
          this.trackPageView(event.url);
        }

        // Announce page changes for screen readers if enabled
        const currentRoute = this.findCurrentRoute(event.url, routes);
        if (currentRoute?.data?.accessibility?.announcePageChange) {
          this.announcePageChange(currentRoute.data.title);
        }
      }
    });
  }

  /**
   * Tracks page views in analytics system
   * @private
   * @param url Current route URL
   */
  private trackPageView(url: string): void {
    // Analytics tracking implementation
    console.log(`Page view tracked: ${url}`);
  }

  /**
   * Announces page changes for screen readers
   * @private
   * @param title Page title to announce
   */
  private announcePageChange(title: string): void {
    const announcement = `Navigated to ${title}`;
    // Implementation for screen reader announcement
    console.log(`Screen reader announcement: ${announcement}`);
  }

  /**
   * Finds current route configuration
   * @private
   * @param url Current URL
   * @param routes Route configuration
   * @returns Matching route configuration
   */
  private findCurrentRoute(url: string, routes: Routes): any {
    // Route matching implementation
    return routes.find(route => url.startsWith(route.path || ''));
  }
}