import { createReducer, on } from '@ngrx/store';
import { IActivityState } from '../state/activity.state';
import * as ActivityActions from '../actions/activity.actions';

export const initialState: IActivityState = {
  activities: [],
  loading: false,
  error: null
};

export const activityReducer = createReducer(
  initialState,
  
  // Load activities
  on(ActivityActions.loadActivities, state => ({
    ...state,
    loading: true,
    error: null
  })),
  
  // Load activities success
  on(ActivityActions.loadActivitiesSuccess, (state, { activities }) => ({
    ...state,
    activities,
    loading: false,
    error: null
  })),
  
  // Load activities failure
  on(ActivityActions.loadActivitiesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

export function reducer(state: IActivityState | undefined, action: any) {
  return activityReducer(state, action);
} 