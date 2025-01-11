// @ngrx/store v15.0.0
import { createReducer, on, Action } from '@ngrx/store';
import { IContract, ContractStatus } from '@shared/models/contract.model';
import {
  loadContracts,
  loadContractsSuccess,
  loadContractsFailure,
  uploadContract,
  uploadContractSuccess,
  uploadContractFailure,
  validateContract,
  validateContractSuccess,
  validateContractFailure,
  extractContractData,
  extractContractDataSuccess,
  extractContractDataFailure,
  selectContract,
  clearSelectedContract,
  batchUploadContracts,
  clearContractError
} from '../actions/contract.actions';

/**
 * Enhanced interface for contract-related state management
 * Includes comprehensive tracking of processing states and metadata
 */
export interface ContractState {
  contracts: IContract[];
  selectedContract: IContract | null;
  loading: boolean;
  error: string | null;
  searchQuery: string | null;
  sortCriteria: { field: string; direction: 'asc' | 'desc' } | null;
  filterCriteria: { status: string[] } | null;
  processingContracts: string[];
  validatingContracts: string[];
  metadata: {
    lastUpdate: Date | null;
    totalCount: number;
  };
}

/**
 * Initial state with default values for contract management
 * Implements comprehensive state tracking with type safety
 */
export const initialState: ContractState = {
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

/**
 * Enhanced contract reducer with optimized state updates and comprehensive error handling
 * Implements immutable state updates with performance optimizations
 */
export const contractReducer = createReducer(
  initialState,

  // Load Contracts Actions
  on(loadContracts, (state): ContractState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadContractsSuccess, (state, { contracts }): ContractState => ({
    ...state,
    contracts: [...contracts],
    loading: false,
    metadata: {
      ...state.metadata,
      lastUpdate: new Date(),
      totalCount: contracts.length
    }
  })),

  on(loadContractsFailure, (state, { error }): ContractState => ({
    ...state,
    loading: false,
    error: error.message
  })),

  // Upload Contract Actions
  on(uploadContract, (state, { contract }): ContractState => ({
    ...state,
    processingContracts: [...state.processingContracts, contract.file.name]
  })),

  on(uploadContractSuccess, (state, { contract }): ContractState => ({
    ...state,
    contracts: [...state.contracts, contract],
    processingContracts: state.processingContracts.filter(id => id !== contract.id),
    metadata: {
      ...state.metadata,
      lastUpdate: new Date(),
      totalCount: state.contracts.length + 1
    }
  })),

  on(uploadContractFailure, (state, { error }): ContractState => ({
    ...state,
    error: error.message
  })),

  // Validation Actions
  on(validateContract, (state, { id }): ContractState => ({
    ...state,
    validatingContracts: [...state.validatingContracts, id]
  })),

  on(validateContractSuccess, (state, { contract }): ContractState => ({
    ...state,
    contracts: state.contracts.map(c => 
      c.id === contract.id ? { ...c, ...contract, status: ContractStatus.VALIDATED } : c
    ),
    validatingContracts: state.validatingContracts.filter(id => id !== contract.id)
  })),

  on(validateContractFailure, (state, { id, error }): ContractState => ({
    ...state,
    contracts: state.contracts.map(c =>
      c.id === id ? { ...c, status: ContractStatus.FAILED, error_message: error.message } : c
    ),
    validatingContracts: state.validatingContracts.filter(cid => cid !== id),
    error: error.message
  })),

  // OCR Data Extraction Actions
  on(extractContractData, (state, { id }): ContractState => ({
    ...state,
    contracts: state.contracts.map(c =>
      c.id === id ? { ...c, status: ContractStatus.PROCESSING } : c
    ),
    processingContracts: [...state.processingContracts, id]
  })),

  on(extractContractDataSuccess, (state, { contract }): ContractState => ({
    ...state,
    contracts: state.contracts.map(c =>
      c.id === contract.id ? { ...c, ...contract, status: ContractStatus.VALIDATION_REQUIRED } : c
    ),
    processingContracts: state.processingContracts.filter(id => id !== contract.id)
  })),

  on(extractContractDataFailure, (state, { id, error }): ContractState => ({
    ...state,
    contracts: state.contracts.map(c =>
      c.id === id ? { ...c, status: ContractStatus.FAILED, error_message: error.message } : c
    ),
    processingContracts: state.processingContracts.filter(cid => cid !== id),
    error: error.message
  })),

  // Selection Actions
  on(selectContract, (state, { id }): ContractState => ({
    ...state,
    selectedContract: state.contracts.find(c => c.id === id) || null
  })),

  on(clearSelectedContract, (state): ContractState => ({
    ...state,
    selectedContract: null
  })),

  // Batch Operations
  on(batchUploadContracts, (state, { contracts }): ContractState => ({
    ...state,
    loading: true,
    processingContracts: [...state.processingContracts, ...contracts.map(c => c.file.name)],
    metadata: {
      ...state.metadata,
      lastUpdate: new Date()
    }
  })),

  // Error Handling
  on(clearContractError, (state): ContractState => ({
    ...state,
    error: null
  }))
);

/**
 * Export the reducer function with type safety
 */
export function reducer(state: ContractState | undefined, action: Action) {
  return contractReducer(state, action);
}