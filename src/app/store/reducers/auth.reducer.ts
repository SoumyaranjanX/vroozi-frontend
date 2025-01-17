/**
 * @fileoverview Authentication reducer for NgRx state management
 * Implements secure token management and comprehensive error handling
 * @version 1.0.0
 * @package @ngrx/store@15.0.0
 */

import { createReducer, on } from '@ngrx/store'; // @ngrx/store@15.0.0
import * as AuthActions from '../actions/auth.actions';
import { IAuthState, initialAuthState } from '../state/auth.state';

/**
 * Authentication reducer implementing immutable state updates
 * Handles all authentication-related actions with comprehensive error handling
 */
export const reducer = createReducer(
  initialAuthState,
  
  // Login actions
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, accessToken, refreshToken, tokenExpiry }) => ({
    ...state,
    user,
    accessToken,
    refreshToken,
    tokenExpiry: tokenExpiry?.toString() || null,
    loading: false,
    error: null,
    loginAttempts: 0
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    loginAttempts: state.loginAttempts + 1
  })),

  // Registration actions
  on(AuthActions.register, (state) => ({
    ...state,
    registration: {
      ...state.registration,
      loading: true,
      error: null,
      success: false
    }
  })),

  on(AuthActions.registerSuccess, (state) => ({
    ...state,
    registration: {
      loading: false,
      error: null,
      success: true
    }
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    registration: {
      loading: false,
      error,
      success: false
    }
  })),

  on(AuthActions.resetRegistrationState, (state) => ({
    ...state,
    registration: {
      loading: false,
      error: null,
      success: false
    }
  })),

  // Logout actions
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...initialAuthState
  }))
);

/**
 * Type-safe selector helpers for accessing authentication state
 */
export const selectAuthState = (state: { auth: IAuthState }) => state.auth;
export const selectAuthError = (state: { auth: IAuthState }) => state.auth.error;