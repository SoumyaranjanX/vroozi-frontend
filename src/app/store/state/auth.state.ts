import { IUser } from '../../shared/models/user.model';

export interface IAuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: string | null;
  loading: boolean;
  error: string | null;
  registration: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  loginAttempts: number;
  rememberMe: boolean;
}

export const initialAuthState: IAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  loading: false,
  error: null,
  registration: {
    loading: false,
    error: null,
    success: false
  },
  loginAttempts: 0,
  rememberMe: false
}; 