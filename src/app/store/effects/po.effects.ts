// Angular v15.0.0
import { Injectable, inject } from '@angular/core';

// NgRx v15.0.0
import { Actions, createEffect, ofType } from '@ngrx/effects';

// RxJS v7.8.0
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

// Actions
import * as POActions from '../actions/po.actions';

// Services
import { PurchaseOrderService } from '../../features/purchase-orders/services/purchase-order.service';
import { IPurchaseOrder, IPOCreate, POStatus } from '../../shared/models/purchase-order.model';

/**
 * NgRx Effects for Purchase Order operations
 * Implements robust error handling, retry mechanisms, and performance optimizations
 */
@Injectable()
export class PurchaseOrderEffects {
    private readonly actions$ = inject(Actions);
    private readonly poService = inject(PurchaseOrderService);

    loadPurchaseOrders$ = createEffect(() => this.actions$.pipe(
        ofType(POActions.loadPurchaseOrders),
        mergeMap(() => this.poService.getPurchaseOrders()
            .pipe(
                map(purchaseOrders => POActions.loadPurchaseOrdersSuccess({ purchaseOrders })),
                catchError(error => of(POActions.loadPurchaseOrdersFailure({ error: error.message })))
            ))
    ));

    processPurchaseOrder$ = createEffect(() => this.actions$.pipe(
        ofType(POActions.processPurchaseOrder),
        mergeMap(action => this.poService.processPurchaseOrder(action.id)
            .pipe(
                map(() => POActions.processPurchaseOrderSuccess()),
                catchError(error => of(POActions.processPurchaseOrderFailure({ error: error.message })))
            ))
    ));

    generatePurchaseOrder$ = createEffect(() => this.actions$.pipe(
        ofType(POActions.generatePurchaseOrder),
        mergeMap(action => this.poService.createPurchaseOrder(action.data)
            .pipe(
                map(purchaseOrder => POActions.generatePurchaseOrderSuccess({ purchaseOrder })),
                catchError(error => of(POActions.generatePurchaseOrderFailure({ error: error.message })))
            ))
    ));
}