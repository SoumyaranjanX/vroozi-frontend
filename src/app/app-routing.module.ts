/**
 * @fileoverview Root routing module implementing secure route protection, role-based access control,
 * and optimized lazy loading strategies for the Contract Processing System.
 * @version 1.0.0
 * @license MIT
 */

// @angular/core v15.0.0
import { NgModule } from '@angular/core';

// @angular/router v15.0.0
import { RouterModule, Routes } from '@angular/router';

// Internal imports
import { AuthGuard } from '@core/auth/auth.guard';
import { environment } from '../environments/environment';
import { UserRole } from '@shared/models/user.model';

/**
 * Main application routes with enhanced security and lazy loading
 */
const routes: Routes = [
  // Authentication module - no guard needed for auth routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
    data: {
      preload: true
    }
  },

  // Dashboard module - protected with role-based access
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module')
      .then(m => m.DashboardModule),
    data: {
      roles: [
        UserRole.ADMIN,
        UserRole.CONTRACT_MANAGER,
        UserRole.REVIEWER,
        UserRole.BASIC_USER
      ],
      preload: true,
      title: 'Dashboard',
      breadcrumb: 'Dashboard'
    }
  },

  // Profile route
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
    data: {
      title: 'User Profile',
      breadcrumb: 'Profile'
    }
  },

  // Settings route
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
    data: {
      title: 'Settings',
      breadcrumb: 'Settings'
    }
  },

  // Default redirect to dashboard
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // Contracts management module - protected with role-based access
  {
    path: 'contracts',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./features/contracts/contracts.module')
      .then(m => m.ContractsModule),
    data: {
      roles: [
        UserRole.ADMIN,
        UserRole.CONTRACT_MANAGER,
        UserRole.REVIEWER
      ],
      preload: true,
      title: 'Contracts Management',
      breadcrumb: 'Contracts'
    }
  },

  // Purchase orders module - protected with role-based access
  {
    path: 'purchase-orders',
    loadChildren: () => import('./features/purchase-orders/purchase-orders.module')
      .then(m => m.PurchaseOrdersModule)
  },

  // Catch all route - redirect to dashboard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

/**
 * Root routing module that configures the application's main routes
 * with enhanced security, role-based access, and optimized lazy loading
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor() {
    if (!environment.production) {
      console.log('AppRoutingModule initialized');
    }
  }
}