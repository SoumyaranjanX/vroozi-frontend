// Angular v15.0.0
import { Component, OnInit, ViewChild, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, forkJoin, switchMap, interval, takeWhile, take, from, concatMap, finalize, takeUntil, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IContract, ContractStatus } from '../../../../shared/models/contract.model';
import { ContractService } from '../../services/contract.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup } from '@angular/forms';

interface ContractMetadata {
  name?: string;
  size?: number;
  type?: string;
  original_name?: string;
  file_size?: number;
  file_type?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-contract-list',
  templateUrl: './contract-list.component.html',
  styleUrls: ['./contract-list.component.scss']
})
export class ContractListComponent implements OnInit, OnDestroy {
  contracts: IContract[] = [];
  contracts$: Observable<IContract[]>;
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  dataSource: MatTableDataSource<IContract>;
  selection = new SelectionModel<IContract>(true, []);
  displayedColumns: string[] = ['select', 'id', 'name', 'created_at', 'status', 'created_by', 'actions'];
  today = new Date();
  ContractStatus = ContractStatus; // Make enum available to template
  filterForm = new FormGroup({});

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  get selectedContracts() {
    return this.selection.selected;
  }

  processingContracts: string[] = []; // Array to track contracts being processed
  private destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<IContract>([]);
    this.contracts$ = this.contractService.getContracts().pipe(
      map(contracts => {
        // Sort contracts by ID (ascending)
        const sortedContracts = [...contracts].sort((a, b) => Number(a.id) - Number(b.id));
        this.dataSource.data = sortedContracts;
        return sortedContracts;
      })
    );
  }

  ngOnInit(): void {
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Set initial sort
    if (this.sort) {
      this.sort.sort({
        id: 'id',
        start: 'asc',
        disableClear: false
      });
    }

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
        case 'id': return Number(item.id);
        case 'created_at': return new Date(item.created_at).getTime();
        case 'name': {
          const metadata = item.metadata as ContractMetadata;
          return metadata?.name?.toLowerCase() || '';
        }
        case 'created_by': return item.created_by?.toString().toLowerCase() || '';
        case 'status': return item.status;
        default: return (item as any)[property];
      }
    };

    // Custom filter predicate to search across multiple fields
    this.dataSource.filterPredicate = (data: IContract, filter: string) => {
      const searchStr = filter.toLowerCase();
      const metadata = data.metadata as ContractMetadata;
      return (
        data.id.toString().includes(searchStr) ||
        (metadata?.name?.toLowerCase().includes(searchStr) || false) ||
        data.status.toLowerCase().includes(searchStr) ||
        (data.created_by?.toString().toLowerCase().includes(searchStr) || false)
      );
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected() {
    const pendingContracts = this.dataSource.data.filter(contract => 
      contract.status === ContractStatus.PENDING
    );
    const numSelected = this.selection.selected.filter(contract => 
      contract.status === ContractStatus.PENDING
    ).length;
    return pendingContracts.length > 0 && numSelected === pendingContracts.length;
  }

  masterToggle() {
    const pendingContracts = this.dataSource.data.filter(contract => 
      contract.status === ContractStatus.PENDING
    );
    
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.clear(); // Clear first to avoid mixing with non-PENDING
      pendingContracts.forEach(contract => this.selection.select(contract));
    }
  }

  onContractSelect(contract: IContract) {
    if (contract.status === ContractStatus.PENDING) {
      this.selection.toggle(contract);
    }
  }

  viewContract(contract: IContract) {
    this.router.navigate(['/contracts', contract.id, 'view']);
  }

  processContract(contract: IContract): void {
    if (contract.status !== ContractStatus.PENDING && contract.status !== ContractStatus.FAILED) {
      return;
    }

    // Submit the processing request
    this.contractService.processContract(contract.id)
      .pipe(
        takeUntil(this.destroy$),
        // Start polling for status updates
        switchMap(() => {
          return interval(2000).pipe(
            switchMap(() => this.contractService.getContract(contract.id)),
            takeWhile(updatedContract => 
              updatedContract.status === ContractStatus.PENDING || 
              updatedContract.status === ContractStatus.PROCESSING, 
              true
            )
          );
        })
      )
      .subscribe({
        next: (updatedContract) => {
          const index = this.contracts.findIndex(c => c.id === contract.id);
          if (index !== -1) {
            this.contracts[index] = updatedContract;
            this.dataSource.data = [...this.contracts];
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error processing contract:', error);
          this.showError('Failed to process contract');
        }
      });
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case ContractStatus.VALIDATED:
        return 'check_circle';
      case ContractStatus.COMPLETED:
        return 'task_alt';
      case ContractStatus.PENDING:
        return 'hourglass_empty';
      case ContractStatus.PROCESSING:
        return 'sync';
      case ContractStatus.VALIDATION_REQUIRED:
        return 'rule';
      case ContractStatus.FAILED:
        return 'error_outline';
      default:
        return 'help';
    }
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      [ContractStatus.PENDING]: 'pending',
      [ContractStatus.PROCESSING]: 'processing',
      [ContractStatus.VALIDATION_REQUIRED]: 'validation-required',
      [ContractStatus.VALIDATED]: 'validated',
      [ContractStatus.FAILED]: 'failed',
      [ContractStatus.COMPLETED]: 'completed'
    };
    return statusMap[status] || 'unknown';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadNewContract() {
    this.router.navigate(['/contracts/upload']);
  }

  processSelectedContracts(): void {
    const pendingContracts = this.selection.selected
      .filter(contract => contract.status === ContractStatus.PENDING);

    if (pendingContracts.length === 0) {
      return;
    }

    from(pendingContracts).pipe(
      takeUntil(this.destroy$),
      concatMap(contract => 
        this.contractService.processContract(contract.id).pipe(
          switchMap(() => {
            return interval(2000).pipe(
              switchMap(() => this.contractService.getContract(contract.id)),
              takeWhile(updatedContract => 
                updatedContract.status === ContractStatus.PENDING || 
                updatedContract.status === ContractStatus.PROCESSING, 
                true
              )
            );
          })
        )
      )
    ).subscribe({
      next: (updatedContract) => {
        const index = this.contracts.findIndex(c => c.id === updatedContract.id);
        if (index !== -1) {
          this.contracts[index] = updatedContract;
          this.dataSource.data = [...this.contracts];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error processing contracts:', error);
        this.showError('Failed to process some contracts');
      }
    });
  }

  validateContract(contract: IContract) {
    if (contract.status !== ContractStatus.VALIDATION_REQUIRED) {
      this.showError('Only contracts requiring validation can be validated');
      return;
    }

    // Navigate to validation page
    this.router.navigate(['/contracts', contract.id, 'validate']);
  }

  createPurchaseOrder(contract: IContract): void {
    if (contract.status !== ContractStatus.VALIDATED) {
      this.showError('Only validated contracts can be used to create purchase orders');
      return;
    }

    // Navigate to purchase order creation page with contract ID
    this.router.navigate(['/purchase-orders/new'], {
      queryParams: { contractId: contract.id }
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Helper methods for template
  hasPendingSelectedContracts(): boolean {
    return this.selection.selected.some(contract => contract.status === ContractStatus.PENDING);
  }

  pendingContractsCount(): number {
    return this.selection.selected.filter(contract => contract.status === ContractStatus.PENDING).length;
  }

  isProcessing(contractId: string): boolean {
    return this.processingContracts.includes(contractId);
  }

  private loadContracts(): void {
    this.loading$.next(true);
    this.contractService.getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts = contracts;
          this.dataSource.data = contracts;
          this.loading$.next(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Failed to load contracts:', error);
          this.loading$.next(false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Gets the file name from the contract metadata or file path
   */
  getFileName(contract: IContract): string {
    const metadata = contract.metadata as ContractMetadata;
    if (metadata?.original_name) {
      return metadata.original_name;
    }
    if (contract.file_path) {
      const parts = contract.file_path.split('/');
      return parts[parts.length - 1];
    }
    return 'Unnamed Contract';
  }

  /**
   * Formats the contract status for display
   */
  formatStatus(status: string): string {
    if (!status) return 'Unknown';
    
    // Replace underscores with spaces and capitalize each word
    return status.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Formats the user ID for display
   */
  formatUserId(userId: string): string {
    if (!userId) return 'System';
    // If it's a long ID (like MongoDB ObjectId), show truncated version
    if (userId.length > 12) {
      return userId.substring(0, 8) + '...';
    }
    return userId;
  }
}