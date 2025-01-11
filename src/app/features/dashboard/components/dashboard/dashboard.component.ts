// Angular v15.0.0
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IAppState } from '@store/state/app.state';
import { IActivity } from '@shared/models/activity.model';
import { selectRecentActivities, selectActivitiesLoading } from '@store/selectors/activity.selectors';
import * as ActivityActions from '@store/actions/activity.actions';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { StatsCardComponent } from '../stats-card/stats-card.component';

interface DashboardMetrics {
  activeContracts: number;
  processingQueue: number;
  pendingReview: number;
  posGenerated: number;
}

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
    StatsCardComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  activities$: Observable<IActivity[]>;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  
  // Dashboard metrics
  metrics: DashboardMetrics = {
    activeContracts: 0,
    processingQueue: 0,
    pendingReview: 0,
    posGenerated: 0
  };

  // Grid columns based on screen size
  gridCols$ = new BehaviorSubject<number>(4);

  constructor(private store: Store<IAppState>) {
    this.activities$ = this.store.select(selectRecentActivities);
  }

  ngOnInit(): void {
    this.setupGridColumns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  }
}