/**
 * @fileoverview Dashboard routing module implementing secure, role-based access control
 * with performance monitoring and error handling capabilities.
 * @version 1.0.0
 * @license MIT
 */

// Angular v15.0.0
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Internal imports
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from '@core/auth/auth.guard';

/**
 * Dashboard routes configuration with role-based access control
 * Implements authorization matrix from section 7.1.3
 */
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'CONTRACT_MANAGER', 'REVIEWER', 'BASIC_USER'],
      title: 'Dashboard',
      breadcrumb: 'Dashboard',
      analytics: {
        page: 'dashboard',
        category: 'navigation'
      },
      performance: {
        trackMetrics: true,
        criticalPath: true
      }
    },
    resolve: {
      // Add resolvers if needed for data prefetching
    },
    children: [
      // Child routes can be added here if needed
    ]
  }
];

/**
 * Dashboard routing module that configures secure routes with role-based authentication,
 * performance monitoring, and error handling.
 */
@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [
    // Add route-specific providers if needed
  ]
})
export class DashboardRoutingModule {
  constructor() {}
}