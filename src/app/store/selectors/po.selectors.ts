/**
 * @fileoverview Purchase Order selectors for NgRx store
 * Implements memoized selectors for efficient state access and derived data
 * @version 1.0.0
 * @license MIT
 */

// External imports
import { createSelector, createFeatureSelector } from '@ngrx/store'; // v15.0.0
import { Dictionary } from '@ngrx/entity';

// Internal imports
import { POState, purchaseOrderAdapter } from '../state/po.state';
import { IPurchaseOrder, POStatus } from '../../shared/models/purchase-order.model';

/**
 * Feature selector for purchase orders state
 */
export const selectPOState = createFeatureSelector<POState>('purchaseOrders');

/**
 * Entity adapter selectors
 */
const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = purchaseOrderAdapter.getSelectors(selectPOState);

export const selectPOIds = selectIds;
export const selectPOEntities = selectEntities;
export const selectAllPurchaseOrders = selectAll;
export const selectPOTotal = selectTotal;

/**
 * Select loading state
 */
export const selectPOLoading = createSelector(
  selectPOState,
  (state: POState) => state.loading
);

/**
 * Select error state
 */
export const selectPOError = createSelector(
  selectPOState,
  (state: POState) => state.error
);

/**
 * Select selected PO ID
 */
export const selectSelectedPOId = createSelector(
  selectPOState,
  (state: POState) => state.selectedId
);

/**
 * Select selected PO
 */
export const selectSelectedPO = createSelector(
  selectPOEntities,
  selectSelectedPOId,
  (entities: Dictionary<IPurchaseOrder>, selectedId: string | null) => 
    selectedId ? entities[selectedId] || null : null
);

// Alias for loading state
export const selectPurchaseOrdersLoading = selectPOLoading;

// Alias for error state
export const selectPurchaseOrdersError = selectPOError;

/**
 * Select purchase orders by status
 */
export const selectPurchaseOrdersByStatus = (status: POStatus) => createSelector(
  selectAllPurchaseOrders,
  (purchaseOrders: IPurchaseOrder[]) => purchaseOrders.filter(po => po.status === status)
);

export const selectSearchQuery = createSelector(
  selectPOState,
  (state: POState) => state.searchQuery
);

export const selectSortCriteria = createSelector(
  selectPOState,
  (state: POState) => state.sortCriteria
);