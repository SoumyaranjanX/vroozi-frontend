import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap, filter, distinctUntilChanged } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { IActivity } from '@shared/models/activity.model';
import { IAppState } from '@store/state/app.state';
import { selectRecentActivities, selectActivitiesLoading, selectActivitiesError } from '@store/selectors/activity.selectors';
import * as ActivityActions from '@store/actions/activity.actions';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-recent-activity',
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    LoadingComponent,
    TranslateModule
  ]
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  activities$: Observable<IActivity[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  displayedColumns: string[] = ['icon', 'description', 'timestamp'];
  hasLoaded = false;
  dataSource: any;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<IAppState>,
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) {
    this.activities$ = this.store.select(selectRecentActivities).pipe(
      distinctUntilChanged(),
      tap(activities => {
        console.log('Activities from store:', activities);
        if (activities && activities.length > 0) {
          this.hasLoaded = true;
          this.dataSource = activities;
          this.cdr.detectChanges();
        }
      })
    );
    this.loading$ = this.store.select(selectActivitiesLoading).pipe(
      distinctUntilChanged(),
      tap(loading => console.log('Loading state:', loading))
    );
    this.error$ = this.store.select(selectActivitiesError);
  }

  ngOnInit(): void {
    console.log('RecentActivityComponent initialized');
    
    // Ensure cache is invalidated and fresh data is loaded
    this.activityService.invalidateActivitiesCache();
    this.store.dispatch(ActivityActions.loadActivities());
    
    // Subscribe to loading state to track when data has been loaded
    this.loading$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter(loading => !loading)
      )
      .subscribe(() => {
        console.log('Loading completed');
        this.hasLoaded = true;
        this.cdr.detectChanges();
      });

    // Subscribe to activities to ensure UI updates
    this.activities$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter(activities => Array.isArray(activities))
      )
      .subscribe(activities => {
        console.log('Activities subscription:', activities);
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryLoad(): void {
    this.activityService.invalidateActivitiesCache();
    this.store.dispatch(ActivityActions.loadActivities());
  }

  trackById(_: number, activity: IActivity): string {
    return activity.id;
  }

  getActivityIcon(activity: IActivity): string {
    if (!activity.ui) {
      return this.getDefaultIcon(activity.type);
    }
    return activity.ui.icon;
  }

  getActivityClass(activity: IActivity): string {
    if (!activity.ui) {
      return activity.type.toLowerCase();
    }
    return `${activity.type.toLowerCase()} ${activity.ui.color}`;
  }

  private getDefaultIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'contract':
        return 'description';
      case 'purchase_order':
        return 'shopping_cart';
      case 'system':
        return 'settings';
      default:
        return 'info';
    }
  }
}