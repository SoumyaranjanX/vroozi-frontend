/**
 * @fileoverview Purchase Order state management with NgRx Entity
 * Implements state structure and adapter for purchase order entities
 * @version 1.0.0
 * @license MIT
 */

// External imports
import { EntityState, createEntityAdapter } from '@ngrx/entity';

// Internal imports
import { IPurchaseOrder } from '../../shared/models/purchase-order.model';

/**
 * Purchase order state interface extending EntityState
 * Includes additional state properties for PO management
 */
export interface POState extends EntityState<IPurchaseOrder> {
  /** Selected purchase order ID */
  selectedId: string | null;
  /** Loading state for PO operations */
  loading: boolean;
  /** Error message for PO operations */
  error: string | null;
  /** Search query for PO operations */
  searchQuery: string | null;
  /** Sort criteria for PO operations */
  sortCriteria: { field: string; direction: 'asc' | 'desc' } | null;
}

/**
 * Entity adapter for purchase orders
 * Configures how entities are tracked and sorted
 */
export const purchaseOrderAdapter = createEntityAdapter<IPurchaseOrder>({
  selectId: (po: IPurchaseOrder) => po.id,
  sortComparer: (a: IPurchaseOrder, b: IPurchaseOrder) => a.created_at.localeCompare(b.created_at)
});

/**
 * Initial state for purchase orders
 * Sets default values for all state properties
 */
export const initialPOState: POState = purchaseOrderAdapter.getInitialState({
  selectedId: null,
  loading: false,
  error: null,
  searchQuery: null,
  sortCriteria: null
}); 