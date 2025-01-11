import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';

import { IActivity } from '@shared/models/activity.model';
import { IAppState } from '@store/state/app.state';
import { selectRecentActivities, selectActivitiesLoading, selectActivitiesError } from '@store/selectors/activity.selectors';
import * as ActivityActions from '@store/actions/activity.actions';
import { LoadingComponent } from '@shared/components/loading/loading.component';

@Component({
  selector: 'app-recent-activity',
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    LoadingComponent,
    TranslateModule
  ]
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  activities$: Observable<IActivity[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<IAppState>) {
    this.activities$ = this.store.select(selectRecentActivities);
    this.loading$ = this.store.select(selectActivitiesLoading);
    this.error$ = this.store.select(selectActivitiesError);
  }

  ngOnInit(): void {
    this.store.dispatch(ActivityActions.loadActivities());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryLoad(): void {
    this.store.dispatch(ActivityActions.loadActivities());
  }

  trackById(_: number, activity: IActivity): string {
    return activity.id;
  }

  getActivityIcon(type: string): string {
    switch (type) {
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