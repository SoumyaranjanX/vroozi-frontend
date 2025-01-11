import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IPurchaseOrder, POStatus } from '@shared/models/purchase-order.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  getPurchaseOrders(): Observable<IPurchaseOrder[]> {
    return of([
      {
        id: '1',
        po_number: 'PO-2024-001',
        contract_id: '1',
        amount: 25000.00,
        status: POStatus.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template_type: 'STANDARD',
        created_by: 'john.doe@example.com'
      },
      {
        id: '2',
        po_number: 'PO-2024-002',
        contract_id: '1',
        amount: 15000.00,
        status: POStatus.ACTIVE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template_type: 'CUSTOM',
        created_by: 'jane.smith@example.com'
      }
    ]);
  }

  getPurchaseOrder(id: string): Observable<IPurchaseOrder> {
    return this.getPurchaseOrders().pipe(
      map(pos => {
        const po = pos.find(p => p.id === id);
        if (!po) {
          throw new Error('Purchase Order not found');
        }
        return {
          ...po,
          status: POStatus.PROCESSING
        };
      })
    );
  }
} 