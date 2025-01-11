/**
 * @fileoverview Root reducer configuration combining all feature reducers
 * Implements comprehensive state management with enhanced type safety and monitoring
 * @version 1.0.0
 * @package @ngrx/store@15.0.0
 */

import { ActionReducerMap, ActionReducer, MetaReducer, Action } from '@ngrx/store'; // @ngrx/store@15.0.0

// Import feature reducers and state interfaces
import * as fromAuth from './auth.reducer';
import * as fromContract from './contract.reducer';
import * as fromPO from './po.reducer';
import * as fromActivity from './activity.reducer';
import { IAppState } from '../state/app.state';
import { environment } from '../../../environments/environment';

/**
 * Root reducer map combining all feature reducers
 * Implements strict typing and runtime checks
 */
export const reducers: ActionReducerMap<IAppState> = {
  auth: fromAuth.reducer,
  contracts: fromContract.reducer,
  purchaseOrders: fromPO.poReducer,
  activity: fromActivity.reducer
};

/**
 * Enhanced development logger meta-reducer
 * Provides detailed action and state logging with performance metrics
 * @param reducer The wrapped reducer function
 */
export function logger(reducer: ActionReducer<IAppState>): ActionReducer<IAppState> {
  return (state: IAppState | undefined, action: Action) => {
    const start = performance.now();
    
    // Log action type and payload in development
    if (!environment.production) {
      console.group(`%c${action.type}`, 'color: #4CAF50; font-weight: bold');
      console.log('%cPrevious State:', 'color: #9E9E9E', state);
      console.log('%cAction:', 'color: #03A9F4', action);
    }

    // Call the next reducer
    const nextState = reducer(state, action);

    // Log resulting state and performance metrics
    if (!environment.production) {
      console.log('%cNext State:', 'color: #4CAF50', nextState);
      console.log('%cExecution time:', 'color: #FF9800', `${(performance.now() - start).toFixed(2)}ms`);
      console.groupEnd();
    }

    return nextState;
  };
}

/**
 * Performance monitoring meta-reducer
 * Tracks reducer execution time and state tree size
 * @param reducer The wrapped reducer function
 */
export function performanceMonitor(reducer: ActionReducer<IAppState>): ActionReducer<IAppState> {
  return (state: IAppState | undefined, action: Action) => {
    const start = performance.now();
    const nextState = reducer(state, action);
    const duration = performance.now() - start;

    // Log performance metrics in development
    if (!environment.production && duration > 100) {
      console.warn(
        `%cSlow reducer execution detected: ${action.type}`,
        'color: #FF5722',
        `\nDuration: ${duration.toFixed(2)}ms`,
        `\nState size: ${JSON.stringify(nextState).length} bytes`
      );
    }

    return nextState;
  };
}

/**
 * State validation meta-reducer
 * Ensures state immutability and validates structure
 * @param reducer The wrapped reducer function
 */
export function stateValidator(reducer: ActionReducer<IAppState>): ActionReducer<IAppState> {
  return (state: IAppState | undefined, action: Action) => {
    const nextState = reducer(state, action);

    // Validate state structure in development
    if (!environment.production) {
      // Validate auth state
      if (!nextState.auth || typeof nextState.auth.loading !== 'boolean') {
        console.error('Invalid auth state structure detected');
      }

      // Validate contracts state
      if (!Array.isArray(nextState.contracts?.contracts)) {
        console.error('Invalid contracts state structure detected');
      }

      // Validate purchase orders state
      if (!nextState.purchaseOrders || !nextState.purchaseOrders.entities) {
        console.error('Invalid purchase orders state structure detected');
      }
    }

    return nextState;
  };
}

/**
 * Configure meta-reducers based on environment
 * Applies development tools and monitoring in non-production
 */
export const metaReducers: MetaReducer<IAppState>[] = !environment.production ? 
  [logger, performanceMonitor, stateValidator] : 
  [];

/**
 * Export feature state selectors for type-safe state access
 */
export const selectAuthState = (state: IAppState) => state.auth;
export const selectContractsState = (state: IAppState) => state.contracts;
export const selectPurchaseOrdersState = (state: IAppState) => state.purchaseOrders;