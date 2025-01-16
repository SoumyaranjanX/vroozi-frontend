import { IActivity } from '@shared/models/activity.model';

export interface IActivityState {
  activities: IActivity[];
  loading: boolean;
  error: string | null;
} 