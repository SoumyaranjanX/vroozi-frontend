// Angular v15.0.0
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IPurchaseOrder } from '@app/shared/models/purchase-order.model';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { POTemplateViewComponent } from '../po-template-view/po-template-view.component';

@Component({
  selector: 'app-po-list',
  templateUrl: './po-list.component.html',
  styleUrls: ['./po-list.component.scss']
})
export class POListComponent implements OnInit {
  purchaseOrders: IPurchaseOrder[] = [];
  loading = false;
  error: string | null = null;
  
  filterForm: FormGroup;
  dataSource: MatTableDataSource<IPurchaseOrder>;
  displayedColumns: string[] = ['po_number', 'contract_id', 'amount', 'created_at', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private poService: PurchaseOrderService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      contract_id: [''],
      status: [''],
      start_date: [null],
      end_date: [null]
    });

    this.dataSource = new MatTableDataSource<IPurchaseOrder>([]);
  }

  ngOnInit(): void {
    this.loadPurchaseOrders();
    
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPurchaseOrders(): void {
    this.loading = true;
    this.error = null;

    this.poService.getPurchaseOrders().subscribe({
      next: (pos) => {
        this.purchaseOrders = pos;
        this.dataSource.data = pos;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load purchase orders';
        this.loading = false;
        console.error('Error loading purchase orders:', error);
      }
    });
  }

  viewPurchaseOrder(po: IPurchaseOrder): void {
    this.dialog.open(POTemplateViewComponent, {
      width: '80%',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '90vh',
      data: { po },
      autoFocus: false,
      panelClass: 'po-template-dialog'
    });
  }

  previewPurchaseOrder(po: IPurchaseOrder): void {
    this.viewPurchaseOrder(po);
  }

  sendPurchaseOrder(po: IPurchaseOrder): void {
    this.poService.sendPurchaseOrder(po.id).subscribe({
      next: () => {
        this.snackBar.open('Purchase order sent successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error: Error) => {
        this.snackBar.open('Failed to send purchase order', 'Close', {
          duration: 3000
        });
        console.error('Error sending purchase order:', error);
      }
    });
  }

  printPurchaseOrder(po: IPurchaseOrder): void {
    const dialogRef = this.dialog.open(POTemplateViewComponent, {
      width: '80%',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '90vh',
      data: { po },
      autoFocus: false,
      panelClass: 'po-template-dialog'
    });

    dialogRef.afterOpened().subscribe(() => {
      setTimeout(() => {
        window.print();
      }, 1000);
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      PENDING: '#FFA726',
      ACTIVE: '#66BB6A',
      COMPLETED: '#2196F3',
      CANCELLED: '#EF5350'
    };
    return colors[status] || '#9E9E9E';
  }

  private applyFilter(): void {
    const filters = this.filterForm.value;
    
    this.dataSource.filterPredicate = (data: IPurchaseOrder, _: string) => {
      const matchesContractId = !filters.contract_id || 
        data.contract_id.toLowerCase().includes(filters.contract_id.toLowerCase());
      const matchesStatus = !filters.status || data.status === filters.status;
      
      let matchesDate = true;
      if (filters.start_date && filters.end_date) {
        const createdDate = new Date(data.created_at);
        matchesDate = createdDate >= filters.start_date && 
                     createdDate <= filters.end_date;
      }
      
      return matchesContractId && matchesStatus && matchesDate;
    };
    
    this.dataSource.filter = 'true';
  }
}