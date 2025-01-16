import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    LoadingComponent,
    TranslateModule
  ]
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  activities$: Observable<IActivity[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  displayedColumns: string[] = ['icon', 'description', 'timestamp'];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<IAppState>,
    private activityService: ActivityService
  ) {
    this.activities$ = this.store.select(selectRecentActivities);
    this.loading$ = this.store.select(selectActivitiesLoading);
    this.error$ = this.store.select(selectActivitiesError);
  }

  ngOnInit(): void {
    // Initial load is handled by the dashboard component
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