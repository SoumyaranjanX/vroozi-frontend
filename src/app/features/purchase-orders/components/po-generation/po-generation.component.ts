// @angular/core v15.0.0
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
// @angular/forms v15.0.0
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
// @ngrx/store v15.0.0
import { Store } from '@ngrx/store';
// rxjs v7.8.0
import { Subject, takeUntil, Observable } from 'rxjs';
// @angular/material imports
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';

import {
  IPurchaseOrder,
  IPOCreate,
  POTemplateType,
  POOutputFormat,
  POStatus
} from '@shared/models/purchase-order.model';
import { ContractService } from '../../../contracts/services/contract.service';
import { IContract } from '@shared/models/contract.model';

import * as POActions from '../../../../store/actions/po.actions';

import { IAppState } from '../../../../store/state/app.state';
import { 
  selectAllPurchaseOrders,
  selectPurchaseOrdersLoading,
  selectPurchaseOrdersError
} from '../../../../store/selectors/po.selectors';

interface TotalValue {
  amount: number;
  currency: string;
}

interface ContractParty {
  name: string;
  role: string;
  address?: string;
}

interface ExtractedData {
  contract_number?: string;
  parties?: ContractParty[];
  payment_terms?: string;
  total_value?: TotalValue;
  effective_date?: string;
  expiration_date?: string;
}

interface ValidationMessages {
  [key: string]: {
    [key: string]: string;
  };
}

/**
 * Component responsible for purchase order generation with enhanced features
 * including role-based access control, SLA monitoring, and batch processing
 */
@Component({
  selector: 'app-po-generation',
  templateUrl: './po-generation.component.html',
  styleUrls: ['./po-generation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatTooltipModule
  ]
})
export class POGenerationComponent implements OnInit, OnDestroy {
  contract: any;
  isGenerating = false;
  parties: ContractParty[] = [];
  effectiveDate = new FormControl('');
  expirationDate = new FormControl('');
  totalValue = new FormControl('');
  paymentTerms = new FormControl('');
  lineItems: any[] = [];
  private destroy$ = new Subject<void>();
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contractsService: ContractService,
    private store: Store<IAppState>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.loading$ = this.store.select(selectPurchaseOrdersLoading);
    this.error$ = this.store.select(selectPurchaseOrdersError);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['contractId']) {
        this.loadContractDetails(params['contractId']);
      }
    });

    // Subscribe to store error updates
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContractDetails(contractId: string) {
    this.isGenerating = true;
    this.contractsService.getContract(contractId).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.setContractDetails();
        this.isGenerating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading contract:', err);
        this.snackBar.open('Failed to load contract details', 'Close', { duration: 3000 });
        this.isGenerating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private setContractDetails() {
    if (this.contract) {
      const extractedData = typeof this.contract.extracted_data === 'string'
        ? JSON.parse(this.contract.extracted_data)
        : this.contract.extracted_data;

      // Set parties
      if (extractedData.parties) {
        this.parties = extractedData.parties.map((party: ContractParty) => ({
          ...party,
          role: this.formatPartyRole(party.role)
        }));
      } else {
        // Fallback to legacy structure
        this.parties = [
          {
            role: 'BUYER',
            name: extractedData.buyer_name || 'N/A',
            address: extractedData.buyer_address || 'N/A'
          },
          {
            role: 'SUPPLIER',
            name: extractedData.supplier_name || 'N/A',
            address: extractedData.supplier_address || 'N/A'
          }
        ];
      }

      // Set dates
      this.effectiveDate.setValue(this.formatDate(extractedData.effective_date));
      this.expirationDate.setValue(this.formatDate(extractedData.expiration_date));

      // Set financial details
      this.totalValue.setValue(extractedData.total_value || 'N/A');
      this.paymentTerms.setValue(extractedData.payment_terms || 'N/A');

      console.log('Extracted Data:', extractedData); // Debug log

      // Set line items
      if (extractedData.items && Array.isArray(extractedData.items)) {
        this.lineItems = extractedData.items.map((item: any) => ({
          name: item.name || item.description || 'Contract Item',
          description: item.description || '',
          quantity: !item.quantity ? 1 : item.quantity,
          unit_price: !item.unit_price ? extractedData.total_value : item.unit_price,
          total: (!item.quantity ? 1 : item.quantity) * (!item.unit_price ? extractedData.total_value : item.unit_price)
        }));
      } else {
        // Create a default line item if none exists
        const totalAmount = extractedData.total_value || 0;
        this.lineItems = [{
          name: 'Contract Service',
          description: extractedData.payment_terms || 'N/A',
          quantity: 1,
          unit_price: totalAmount,
          total: totalAmount
        }];
      }

      this.cdr.detectChanges();
    }
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  private formatPartyRole(role: string): string {
    if (!role) return 'N/A';
    // Convert to title case and handle special cases
    const formattedRole = role.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return formattedRole;
  }

  generatePurchaseOrder(): void {
    this.isGenerating = true;

    const extractedData = typeof this.contract.extracted_data === 'string'
      ? JSON.parse(this.contract.extracted_data)
      : this.contract.extracted_data;
    
    // Find vendor/provider from parties
    const vendor = this.parties.find(party => 
      party.role.toLowerCase().includes('supplier') || 
      party.role.toLowerCase().includes('vendor') ||
      party.role.toLowerCase().includes('provider')
    );

    // Find buyer/client from parties
    const buyer = this.parties.find(party => 
      party.role.toLowerCase().includes('buyer') ||
      party.role.toLowerCase().includes('client')
    );

    // Get total amount from contract
    const totalAmount = extractedData.total_value?.amount || 0;

    // Prepare line items from contract
    const lineItems = this.lineItems.map(item => ({
      name: item.name || 'Contract Item',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || totalAmount,
      total: (item.quantity || 1) * (item.unit_price || totalAmount)
    }));

    // Calculate total amount from line items
    const calculatedTotal = lineItems.reduce((sum, item) => sum + item.total, 0);

    // Ensure we have a valid vendor name and total amount
    if (!vendor?.name) {
      this.snackBar.open('Error: Vendor name is required', 'Close', { duration: 3000 });
      this.isGenerating = false;
      return;
    }

    if (calculatedTotal <= 0 && totalAmount <= 0) {
      this.snackBar.open('Error: Total amount must be greater than 0', 'Close', { duration: 3000 });
      this.isGenerating = false;
      return;
    }

    // Format payment terms
    const paymentTerms = Array.isArray(extractedData.payment_terms) 
      ? extractedData.payment_terms.join('\n')
      : extractedData.payment_terms || 'Standard payment terms apply';

    // Prepare data according to backend requirements
    const requestData = {
      contract_id: this.contract.id,
      template_type: POTemplateType.STANDARD,
      output_format: POOutputFormat.PDF,
      po_data: {
        vendor_name: vendor.name,
        vendor_address: vendor.address || 'N/A',
        vendor_phone: '',
        vendor_email: '',
        buyer_name: buyer?.name || 'N/A',
        buyer_address: buyer?.address || 'N/A',
        buyer_phone: '',
        buyer_email: '',
        payment_terms: paymentTerms,
        total_amount: calculatedTotal || totalAmount,
        line_items: lineItems,
        subtotal: calculatedTotal || totalAmount,
        tax: 0,
        total: calculatedTotal || totalAmount,
        order_date: new Date().toISOString(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        shipping_address: buyer?.address || 'N/A',
        notes: ''
      }
    };

    // Log the request data for debugging
    console.log('PO Request Data:', requestData);

    // Dispatch action to generate PO
    this.store.dispatch(POActions.generatePurchaseOrder({ data: requestData }));

    // Subscribe to loading state to handle UI updates
    this.loading$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(loading => {
      this.isGenerating = loading;
      if (!loading) {
        this.router.navigate(['/purchase-orders']);
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/purchase-orders']);
  }

  clearError(): void {
    this.store.dispatch(POActions.loadPurchaseOrdersFailure({ error: '' }));
  }

  getPartyColor(role: string): 'primary' | 'accent' | 'warn' {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('buyer') || lowerRole.includes('client')) return 'primary';
    if (lowerRole.includes('supplier') || lowerRole.includes('vendor') || lowerRole.includes('provider')) return 'accent';
    return 'warn';
  }

  getTotalAmount(): number {
    return this.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
}