// @ngrx/store v15.0.0
import { createAction, props } from '@ngrx/store';
import { IPurchaseOrder, IPOCreate } from '../../shared/models/purchase-order.model';

// Load Purchase Orders
export const loadPurchaseOrders = createAction(
  '[Purchase Order] Load Purchase Orders'
);

export const loadPurchaseOrdersSuccess = createAction(
  '[Purchase Order] Load Purchase Orders Success',
  props<{ purchaseOrders: IPurchaseOrder[] }>()
);

export const loadPurchaseOrdersFailure = createAction(
  '[Purchase Order] Load Purchase Orders Failure',
  props<{ error: string }>()
);

// Select Purchase Order
export const selectPurchaseOrder = createAction(
  '[Purchase Order] Select Purchase Order',
  props<{ id: string }>()
);

// Process Purchase Order
export const processPurchaseOrder = createAction(
  '[Purchase Order] Process',
  props<{ id: string }>()
);

export const processPurchaseOrderSuccess = createAction(
  '[Purchase Order] Process Success'
);

export const processPurchaseOrderFailure = createAction(
  '[Purchase Order] Process Failure',
  props<{ error: string }>()
);

// Generate Purchase Order
export const generatePurchaseOrder = createAction(
  '[Purchase Order] Generate Purchase Order',
  props<{ data: IPOCreate }>()
);

export const generatePurchaseOrderSuccess = createAction(
  '[Purchase Order] Generate Purchase Order Success',
  props<{ purchaseOrder: IPurchaseOrder }>()
);

export const generatePurchaseOrderFailure = createAction(
  '[Purchase Order] Generate Purchase Order Failure',
  props<{ error: string }>()
);