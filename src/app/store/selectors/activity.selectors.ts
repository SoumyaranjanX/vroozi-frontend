import { createSelector, createFeatureSelector } from '@ngrx/store';
import { IActivityState } from '../state/activity.state';

export const selectActivityState = createFeatureSelector<IActivityState>('activity');

export const selectRecentActivities = createSelector(
  selectActivityState,
  (state: IActivityState) => state.activities
);

export const selectActivitiesLoading = createSelector(
  selectActivityState,
  (state: IActivityState) => state.loading
);

export const selectActivitiesError = createSelector(
  selectActivityState,
  (state: IActivityState) => state.error
); 