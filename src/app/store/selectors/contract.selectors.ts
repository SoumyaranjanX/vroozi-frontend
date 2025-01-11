/**
 * @fileoverview Contract state selectors for the Contract Processing System
 * Implements memoized, type-safe selectors for contract management with strict null checks
 * @version 1.0.0
 * @license MIT
 */

import { createSelector } from '@ngrx/store'; // v15.0.0
import { IAppState } from '../state/app.state';
import { IContract, ContractStatus } from '../../shared/models/contract.model';

/**
 * Base selector for accessing the contract state slice
 * Provides type-safe access to contract feature state
 */
export const selectContractState = (state: IAppState) => state.contracts;

/**
 * Selector for retrieving all contracts as an immutable array
 * Memoized to prevent unnecessary re-renders
 */
export const selectAllContracts = createSelector(
  selectContractState,
  (state) => state.contracts as ReadonlyArray<IContract>
);

/**
 * Selector for contract loading state
 * Used to show loading indicators in the UI
 */
export const selectContractLoading = createSelector(
  selectContractState,
  (state) => state.loading
);

/**
 * Selector for contract error state
 * Provides type-safe access to error messages with null handling
 */
export const selectContractError = createSelector(
  selectContractState,
  (state) => state.error
);

/**
 * Selector for currently selected contract
 * Returns null if no contract is selected
 */
export const selectSelectedContract = createSelector(
  selectContractState,
  (state) => state.selectedContract
);

/**
 * Selector for filtering contracts by status
 * Returns an immutable array of contracts matching the provided status
 * @param status Contract status to filter by
 */
export const selectContractsByStatus = (status: ContractStatus) =>
  createSelector(
    selectAllContracts,
    (contracts) => contracts.filter(contract => contract.status === status) as ReadonlyArray<IContract>
  );

/**
 * Selector for contracts in pending state
 * Used for displaying contracts awaiting processing
 */
export const selectPendingContracts = createSelector(
  selectAllContracts,
  (contracts) => contracts.filter(
    contract => contract.status === ContractStatus.PENDING
  ) as ReadonlyArray<IContract>
);

/**
 * Selector for contracts in processing state
 * Used for monitoring active OCR/data extraction
 */
export const selectProcessingContracts = createSelector(
  selectAllContracts,
  (contracts) => contracts.filter(
    contract => contract.status === ContractStatus.PROCESSING
  ) as ReadonlyArray<IContract>
);

/**
 * Selector for contracts in validated state
 * Used for displaying contracts ready for PO generation
 */
export const selectValidatedContracts = createSelector(
  selectAllContracts,
  (contracts) => contracts.filter(
    contract => contract.status === ContractStatus.VALIDATED
  ) as ReadonlyArray<IContract>
);

/**
 * Selector for contracts in error state
 * Used for error handling and reporting
 */
export const selectErrorContracts = createSelector(
  selectAllContracts,
  (contracts) => contracts.filter(
    contract => contract.status === ContractStatus.FAILED
  ) as ReadonlyArray<IContract>
);

/**
 * Selector for contract search results
 * Filters contracts based on search query in state
 */
export const selectContractSearchResults = createSelector(
  selectAllContracts,
  selectContractState,
  (contracts, state) => {
    if (!state.searchQuery) {
      return contracts;
    }
    const query = state.searchQuery.toLowerCase();
    return contracts.filter(contract => 
      Object.values(contract.metadata).some(value => 
        String(value).toLowerCase().includes(query)
      )
    ) as ReadonlyArray<IContract>;
  }
);

/**
 * Selector for sorted contracts
 * Applies current sort criteria from state
 */
export const selectSortedContracts = createSelector(
  selectAllContracts,
  selectContractState,
  (contracts, state) => {
    if (!state.sortCriteria) {
      return contracts;
    }
    const { field, direction } = state.sortCriteria;
    return [...contracts].sort((a, b) => {
      const aValue = String(a.metadata[field] || '');
      const bValue = String(b.metadata[field] || '');
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }) as ReadonlyArray<IContract>;
  }
);