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
  on(ActivityActions.loadActivitiesSuccess, (state, { activities }) => {
    console.log('Reducer: loadActivitiesSuccess', activities); // Debug log
    return {
      ...state,
      activities: activities || [],
      loading: false,
      error: null
    };
  }),
  
  // Load activities failure
  on(ActivityActions.loadActivitiesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear activities (new action)
  on(ActivityActions.clearActivities, () => ({
    ...initialState
  }))
);

export function reducer(state: IActivityState | undefined, action: any) {
  return activityReducer(state, action);
} 