import { Component, Input, OnInit, Inject } from '@angular/core';
import { IPurchaseOrder } from '@app/shared/models/purchase-order.model';
import { environment } from '@env/environment';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-po-template-view',
  templateUrl: './po-template-view.component.html',
  styleUrls: ['./po-template-view.component.scss']
})
export class POTemplateViewComponent implements OnInit {
  @Input() po?: IPurchaseOrder;
  
  companyName: string = environment.companyName;
  companyLogo: string = environment.companyLogo;
  companyAddress: string = environment.companyAddress;
  companyPhone: string = environment.companyPhone;
  companyEmail: string = environment.companyEmail;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { po: IPurchaseOrder }) {
    if (data?.po) {
      this.po = data.po;
    }
  }

  ngOnInit(): void {
    if (!this.po) {
      console.warn('No purchase order data provided to POTemplateViewComponent');
    }
  }

  print(): void {
    window.print();
  }

  getLineItems() {
    return this.po?.po_data?.line_items || this.po?.line_items || [];
  }

  getTotal() {
    return this.po?.po_data?.total_amount || this.po?.total || 0;
  }

  getSubtotal() {
    return this.po?.po_data?.total_amount || this.po?.subtotal || 0;
  }

  getVendorName() {
    return this.po?.po_data?.vendor_name || this.po?.vendor_name;
  }

  getVendorAddress() {
    return this.po?.po_data?.vendor_address || this.po?.vendor_address;
  }

  getVendorPhone() {
    return this.po?.vendor_phone;
  }

  getVendorEmail() {
    return this.po?.vendor_email;
  }

  getBuyerName() {
    return this.po?.po_data?.buyer_name || this.po?.buyer_name;
  }

  getBuyerAddress() {
    return this.po?.po_data?.buyer_address || this.po?.buyer_address;
  }

  getBuyerPhone() {
    return this.po?.buyer_phone;
  }

  getBuyerEmail() {
    return this.po?.buyer_email;
  }

  getPaymentTerms() {
    return this.po?.po_data?.payment_terms || this.po?.payment_terms || 'Standard payment terms apply';
  }

  getNotes() {
    return this.po?.po_data?.notes || this.po?.notes || '';
  }

  getShippingAddress() {
    return this.po?.po_data?.shipping_address;
  }
} 