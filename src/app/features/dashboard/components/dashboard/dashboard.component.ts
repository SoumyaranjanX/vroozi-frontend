// Angular v15.0.0
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { finalize, switchMap, takeUntil, filter } from 'rxjs/operators';

import { IAppState } from '@store/state/app.state';
import { IActivity } from '@shared/models/activity.model';
import { selectRecentActivities, selectActivitiesLoading } from '@store/selectors/activity.selectors';
import * as ActivityActions from '@store/actions/activity.actions';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';
import { DashboardMetrics, DashboardService } from '../../services/dashboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    RecentActivityComponent,
    StatsCardComponent,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  metrics$: Observable<DashboardMetrics>;
  activities$: Observable<IActivity[]>;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  // Grid columns based on screen size
  gridCols$ = new BehaviorSubject<number>(4);

  constructor(
    private store: Store<IAppState>,
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Initialize data streams
    this.metrics$ = this.dashboardService.metrics$;
    this.activities$ = this.store.select(selectRecentActivities);
  }

  ngOnInit(): void {
    // Initial load
    this.initializeDashboard();
    this.loadActivities();
    this.setupGridColumns();

    // Subscribe to router events to refresh data when returning to dashboard
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter(event => (event as NavigationEnd).url === '/dashboard'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadActivities();
      });

    // Set up auto-refresh every 30 seconds
    const REFRESH_INTERVAL = 30000; // 30 seconds
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadActivities();
      }
    }, REFRESH_INTERVAL);

    // Clean up interval on destroy
    this.destroy$.subscribe(() => clearInterval(refreshInterval));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize dashboard data and set up auto-refresh
   */
  private initializeDashboard(): void {
    // Initial data load
    this.loadDashboardData();
  }

  /**
   * Load dashboard data
   */
  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService
      .fetchDashboardData()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }
  private loadActivities(): void {
    this.store.dispatch(ActivityActions.loadActivities());
  }

  private setupGridColumns(): void {
    // Update grid columns based on window width
    const updateGridCols = () => {
      const width = window.innerWidth;
      if (width < 600) {
        this.gridCols$.next(1);
      } else if (width < 960) {
        this.gridCols$.next(2);
      } else if (width < 1280) {
        this.gridCols$.next(3);
      } else {
        this.gridCols$.next(4);
      }
    };

    // Initial setup
    updateGridCols();

    // Listen for window resize
    window.addEventListener('resize', updateGridCols);

    // Clean up event listener on destroy
    this.destroy$.subscribe(() => {
      window.removeEventListener('resize', updateGridCols);
    });
  }

  /**
   * Returns tooltip text for each metric card
   */
  getMetricTooltip(metricKey: string, metrics: DashboardMetrics): string {
    switch (metricKey) {
      case 'activeContracts':
        return `Active contracts: ${
          metrics.activeContracts.count
        }\nAverage age: ${metrics.activeContracts.averageAge.toFixed(1)} days`;
      case 'processingQueue':
        return `Processing queue: ${
          metrics.processingQueue.count
        }\nAverage time: ${metrics.processingQueue.averageProcessingTime.toFixed(1)} mins`;
      case 'pendingReview':
        return `Pending review: ${metrics.pendingReview.count}\nUrgent reviews: ${metrics.pendingReview.urgentReviews}`;
      case 'posGenerated':
        return `POs generated: ${metrics.posGenerated.count}\nTotal POs: ${metrics.posGenerated.totalPos}`;
      default:
        return '';
    }
  }
}
