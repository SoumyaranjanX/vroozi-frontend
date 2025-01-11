/**
 * @fileoverview Root state management for the Contract Processing System
 * Implements NgRx store with authentication, contract management, and purchase order states
 * @version 1.0.0
 * @license MIT
 */

// External imports
import { EntityState } from '@ngrx/entity'; // v15.0.0

// Internal model imports
import { IUser } from '../../shared/models/user.model';
import { IContract } from '../../shared/models/contract.model';
import { IPurchaseOrder } from '../../shared/models/purchase-order.model';
import { IAuthState } from './auth.state';
import { IActivityState } from './activity.state';
import { POState, initialPOState } from './po.state';

/**
 * Contract management state interface
 * Handles contract data with search, sort, and filter capabilities
 */
export interface IContractState {
  /** List of available contracts */
  contracts: IContract[];
  /** Currently selected contract for viewing/editing */
  selectedContract: IContract | null;
  /** Contract operation loading state */
  loading: boolean;
  /** Contract operation error message */
  error: string | null;
  /** Current search query for contracts */
  searchQuery: string | null;
  /** Contract list sorting configuration */
  sortCriteria: { field: string; direction: 'asc' | 'desc' } | null;
  /** Contract filtering criteria */
  filterCriteria: { status: string[] } | null;
  /** Contracts currently being processed */
  processingContracts: string[];
  /** Contracts under validation */
  validatingContracts: string[];
  /** Additional contract metadata */
  metadata: {
    lastUpdate: Date | null;
    totalCount: number;
  };
}

/**
 * Root application state interface
 * Combines all feature states into a single state tree
 */
export interface IAppState {
  /** Authentication feature state */
  auth: IAuthState;
  /** Contract management feature state */
  contracts: IContractState;
  /** Purchase order feature state */
  purchaseOrders: POState;
  /** Activity feature state */
  activity: IActivityState;
}

/**
 * Initial contract state
 * Sets default values for contract management
 */
export const initialContractState: IContractState = {
  contracts: [],
  selectedContract: null,
  loading: false,
  error: null,
  searchQuery: null,
  sortCriteria: null,
  filterCriteria: null,
  processingContracts: [],
  validatingContracts: [],
  metadata: {
    lastUpdate: null,
    totalCount: 0
  }
};

export const initialAppState: IAppState = {
  auth: {
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
  },
  contracts: initialContractState,
  purchaseOrders: initialPOState,
  activity: {
    activities: [],
    loading: false,
    error: null
  }
};