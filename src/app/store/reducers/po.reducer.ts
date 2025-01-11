// @ngrx/store v15.0.0
import { createReducer, on } from '@ngrx/store';
import * as POActions from '../actions/po.actions';
import { purchaseOrderAdapter, initialPOState, POState } from '../state/po.state';

export const poReducer = createReducer(
    initialPOState,
    
    // Load Purchase Orders
    on(POActions.loadPurchaseOrders, state => ({
        ...state,
        loading: true,
        error: null
    })),
    
    on(POActions.loadPurchaseOrdersSuccess, (state, { purchaseOrders }) => 
        purchaseOrderAdapter.setAll(purchaseOrders, {
            ...state,
            loading: false,
            error: null
        })
    ),
    
    on(POActions.loadPurchaseOrdersFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Process Purchase Order
    on(POActions.processPurchaseOrder, state => ({
        ...state,
        loading: true,
        error: null
    })),
    
    on(POActions.processPurchaseOrderSuccess, (state) => ({
        ...state,
        loading: false,
        error: null
    })),
    
    on(POActions.processPurchaseOrderFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Select Purchase Order
    on(POActions.selectPurchaseOrder, (state, { id }) => ({
        ...state,
        selectedId: id
    }))
);

export const {
    selectIds,
    selectEntities,
    selectAll,
    selectTotal,
} = purchaseOrderAdapter.getSelectors();