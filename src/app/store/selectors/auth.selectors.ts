/**
 * @fileoverview Authentication state selectors for the Contract Processing System
 * Implements memoized selectors for accessing authentication state, user information,
 * and role-based access control functionality
 * @version 1.0.0
 * @license MIT
 */

// External imports
import { createSelector } from '@ngrx/store'; // v15.0.0

// Internal imports
import { IAppState } from '../state/app.state';
import { IAuthState } from '../state/auth.state';
import { UserRole } from '@shared/models/user.model';

/**
 * Base selector to access the authentication slice of state
 * Provides foundation for all derived auth selectors
 */
export const selectAuth = (state: IAppState) => state.auth;

/**
 * Selector to retrieve the currently authenticated user
 * Returns null if no user is authenticated
 */
export const selectCurrentUser = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.user
);

/**
 * Selector to determine if a user is currently authenticated
 * Checks for both user object and valid access token
 */
export const selectIsAuthenticated = createSelector(
  selectAuth,
  (auth: IAuthState) => !!auth.user && !!auth.accessToken
);

/**
 * Selector to retrieve the current JWT access token
 * Returns null if no token exists
 */
export const selectAccessToken = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.accessToken
);

/**
 * Selector to retrieve the current refresh token
 * Returns null if no refresh token exists
 */
export const selectRefreshToken = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.refreshToken
);

/**
 * Selector to retrieve the authentication loading state
 * Used to show loading indicators during auth operations
 */
export const selectAuthLoading = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.loading
);

/**
 * Selector to retrieve any authentication error message
 * Returns null if no error exists
 */
export const selectAuthError = createSelector(
  selectAuth,
  (auth: IAuthState) => auth.error
);

/**
 * Enhanced selector to retrieve user roles with RBAC support
 * Implements role validation against the authorization matrix
 * Returns empty array if no user is authenticated
 */
export const selectUserRoles = createSelector(
  selectCurrentUser,
  (user) => {
    if (!user) {
      return [];
    }

    // Validate role against authorized roles from UserRole enum
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(user.role)) {
      console.warn(`Invalid role detected: ${user.role}`);
      return [];
    }

    return [user.role];
  }
);

/**
 * Role-based authorization selector
 * Checks if current user has specific role access
 */
export const selectHasRole = (requiredRoles: UserRole[]) => createSelector(
  selectCurrentUser,
  (user) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }
);

/**
 * Enhanced selector for checking admin privileges
 * Specifically checks for ADMIN role access
 */
export const selectIsAdmin = createSelector(
  selectCurrentUser,
  (user) => user?.role === UserRole.ADMIN
);

/**
 * Enhanced selector for checking contract management privileges
 * Checks for either ADMIN or CONTRACT_MANAGER roles
 */
export const selectIsContractManager = createSelector(
  selectCurrentUser,
  (user) => user?.role === UserRole.CONTRACT_MANAGER
);

/**
 * Enhanced selector for checking review privileges
 * Checks for ADMIN, CONTRACT_MANAGER, or REVIEWER roles
 */
export const selectIsReviewer = createSelector(
  selectCurrentUser,
  (user) => user?.role === UserRole.REVIEWER
);

/**
 * Selector to check if user session is expiring soon
 * Used to trigger refresh token flow
 */
export const selectIsSessionExpiringSoon = createSelector(
  selectAuth,
  (auth: IAuthState) => {
    if (!auth.accessToken) {
      return false;
    }
    
    // Check if token is within 5 minutes of expiry
    try {
      const tokenData = JSON.parse(atob(auth.accessToken.split('.')[1]));
      const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      return timeToExpiry > 0 && timeToExpiry <= 5 * 60 * 1000; // 5 minutes
    } catch {
      return false;
    }
  }
);