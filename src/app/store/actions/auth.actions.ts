/**
 * @fileoverview Authentication actions for NgRx state management
 * Implements comprehensive authentication flow with token management
 * @version 1.0.0
 * @package @ngrx/store@15.0.0
 */

import { createAction, props } from '@ngrx/store'; // @ngrx/store@15.0.0
import { IUser, IUserResponse } from '../../shared/models/user.model';

/**
 * Prefix for all authentication actions to maintain unique action types
 * and provide clear action origin in debugging
 */
export const AUTH_ACTION_PREFIX = '[Auth]' as const;

/**
 * Helper function to create type-safe authentication actions
 * @param actionName - The specific action name to be prefixed
 * @returns Prefixed action type string with type safety
 */
const createAuthAction = (actionName: string) => 
    `${AUTH_ACTION_PREFIX} ${actionName}` as const;

/**
 * Action to initiate the login process
 * Includes optional remember me flag for persistent sessions
 */
export const login = createAction(
    '[Auth] Login',
    props<{
        email: string;
        password: string;
        rememberMe?: boolean;
    }>()
);

/**
 * Action dispatched on successful login
 * Includes full user response with tokens and timestamp for tracking
 */
export const loginSuccess = createAction(
    '[Auth] Login Success',
    props<IUserResponse & { timestamp: number }>()
);

/**
 * Action dispatched on login failure
 * Includes structured error information for proper error handling
 */
export const loginFailure = createAction(
    '[Auth] Login Failure',
    props<{ error: string }>()
);

/**
 * Action to initiate the logout process
 * Optional flag to clear local storage during logout
 */
export const logout = createAction('[Auth] Logout');

/**
 * Action to initiate token refresh
 * Silent flag for background refresh without UI updates
 */
export const refreshToken = createAction(
    createAuthAction('Refresh Token'),
    props<{
        silent?: boolean;
    }>()
);

/**
 * Action dispatched on successful token refresh
 * Includes new tokens and timestamp for tracking
 */
export const refreshTokenSuccess = createAction(
    createAuthAction('Refresh Token Success'),
    props<IUserResponse & {
        timestamp: number;
    }>()
);

/**
 * Action dispatched on token refresh failure
 * Includes error details and silent flag for handling strategy
 */
export const refreshTokenFailure = createAction(
    createAuthAction('Refresh Token Failure'),
    props<{
        error: {
            code: string;
            message: string;
        };
        silent?: boolean;
    }>()
);

/**
 * Action to clear any authentication errors from the state
 * Used to reset error state before new authentication attempts
 */
export const clearAuthError = createAction(
    createAuthAction('Clear Auth Error')
);

/**
 * Action to update stored user data
 * Used when user profile is updated while authenticated
 */
export const updateUserData = createAction(
    createAuthAction('Update User Data'),
    props<{
        user: IUser;
    }>()
);

/**
 * Action to handle session timeout
 * Dispatched when token refresh fails due to expiration
 */
export const sessionTimeout = createAction(
    createAuthAction('Session Timeout')
);

/**
 * Action to reset login attempts counter
 * Used after successful login or timeout period
 */
export const resetLoginAttempts = createAction(
    createAuthAction('Reset Login Attempts')
);

// Registration Actions
export const register = createAction(
  '[Auth] Register',
  props<{ 
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ message: string; timestamp: number }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

export const resetRegistrationState = createAction(
  '[Auth] Reset Registration State'
);

export const logoutSuccess = createAction('[Auth] Logout Success');