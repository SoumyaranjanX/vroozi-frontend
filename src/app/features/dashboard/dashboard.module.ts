/**
 * @fileoverview Dashboard feature module implementing high-performance, accessible
 * dashboard view with real-time contract processing statistics and activity monitoring.
 * Follows enterprise design system specifications and implements role-based access control.
 * @version 1.0.0
 * @license MIT
 */

// Angular v15.0.0
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Design modules v15.0.0
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

// Internal imports
import { DashboardRoutingModule } from './dashboard-routing.module';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { ContractService } from '../contracts/services/contract.service';
import { DashboardService } from './services/dashboard.service';
import { PurchaseOrderService } from '../purchase-orders/services/purchase-order.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';

/**
 * Feature module that bundles all dashboard-related components and dependencies.
 * Implements high-performance dashboard with real-time metrics and activity monitoring.
 *
 * Key features:
 * - Real-time contract processing statistics
 * - Activity monitoring with visual indicators
 * - Role-based access control
 * - Accessibility compliance (WCAG AA)
 * - Performance-optimized with OnPush change detection
 */
@NgModule({
  imports: [
    // Angular core modules
    CommonModule,
    DashboardRoutingModule,

    // Material design modules
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,

    // Standalone components
    StatsCardComponent,
    DashboardComponent,
  ],
  providers: [ContractService, PurchaseOrderService, DashboardService],
})
export class DashboardModule {
  constructor() {
    this.setupPerformanceMonitoring();
  }

  /**
   * Configures performance monitoring for dashboard components
   * Implements system availability requirements from section 1.2
   * @private
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Monitor component render times
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 100) {
            // 100ms threshold
            console.warn(
              `Slow render detected in dashboard component: ${entry.name} ` + `(${Math.round(entry.duration)}ms)`
            );
          }
        });
      });

      // Observe long-task timing
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
}
