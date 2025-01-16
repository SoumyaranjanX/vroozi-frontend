import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as ActivityActions from '../actions/activity.actions';
import { ActivityService } from '@features/dashboard/services/activity.service';

@Injectable()
export class ActivityEffects {
    private readonly actions$ = inject(Actions);
    private readonly activityService = inject(ActivityService);

    loadActivities$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ActivityActions.loadActivities),
            switchMap(() =>
                this.activityService.getActivities().pipe(
                    map(activities => ActivityActions.loadActivitiesSuccess({ activities })),
                    catchError(error => 
                        of(ActivityActions.loadActivitiesFailure({ error: error.message }))
                    )
                )
            )
        )
    );
} 