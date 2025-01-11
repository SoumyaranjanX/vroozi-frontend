// Angular v15.0.0
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IPurchaseOrder, POStatus, IPOCreate } from '@app/shared/models/purchase-order.model';
import { environment } from '@env/environment';

// Backend API response type
interface BackendPurchaseOrder {
  id: number;
  po_number: string;
  contract_id: number;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  template_type: string;
  created_by: string;
  vendor_name?: string;
  vendor_address?: string;
  vendor_phone?: string;
  vendor_email?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_phone?: string;
  buyer_email?: string;
  payment_terms?: string;
  line_items?: Array<{
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
}

interface BackendPOCreate {
  contract_id: string;
  template_type: string;
  output_format: string;
  amount: number;
  status: string;
  po_data: {
    vendor_name: string;
    vendor_address: string;
    buyer_name: string;
    buyer_address: string;
    payment_terms: string;
    total_amount: number;
    line_items: Array<{
      name: string;
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = `${environment.apiUrl}/purchase-orders/`;

  constructor(private http: HttpClient) {}

  private adaptPurchaseOrder(po: BackendPurchaseOrder): IPurchaseOrder {
    return {
      ...po,
      id: po.id.toString(),
      contract_id: po.contract_id.toString(),
      status: po.status as POStatus
    };
  }

  getPurchaseOrders(): Observable<IPurchaseOrder[]> {
    return this.http.get<BackendPurchaseOrder[]>(this.apiUrl).pipe(
      map(pos => pos.map(po => this.adaptPurchaseOrder(po)))
    );
  }

  createPurchaseOrder(poData: IPOCreate): Observable<IPurchaseOrder> {
    // Log the request data for debugging
    console.log('Creating purchase order with data:', poData);
    
    // Calculate total amount from line items
    const totalAmount = poData.po_data.line_items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    
    // Structure the request according to backend schema
    const requestData = {
      contract_id: poData.contract_id.toString(),
      template_type: poData.template_type,
      output_format: poData.output_format,
      amount: totalAmount,  // Set amount at root level
      status: 'PENDING',
      po_data: {
        ...poData.po_data,
        total_amount: totalAmount  // Ensure total_amount matches in po_data
      }
    };
    
    console.log('Sending request data:', requestData);
    
    return this.http.post<BackendPurchaseOrder>(this.apiUrl, requestData).pipe(
      map(po => this.adaptPurchaseOrder(po))
    );
  }

  sendPurchaseOrder(poId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${poId}/send`, {});
  }

  processPurchaseOrder(poId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${poId}/process`, {});
  }
}