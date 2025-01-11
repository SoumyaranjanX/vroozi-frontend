import { createAction, props } from '@ngrx/store';
import { IActivity } from '../../shared/models/activity.model';

// Load activities
export const loadActivities = createAction(
  '[Activity] Load Activities'
);

export const loadActivitiesSuccess = createAction(
  '[Activity] Load Activities Success',
  props<{ activities: IActivity[] }>()
);

export const loadActivitiesFailure = createAction(
  '[Activity] Load Activities Failure',
  props<{ error: string }>()
);

export const clearActivities = createAction(
  '[Activity] Clear Activities'
); 