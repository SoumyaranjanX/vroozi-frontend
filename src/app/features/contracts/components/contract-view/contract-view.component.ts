import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, map, filter, tap, switchMap, catchError, EMPTY } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

import { 
    IContract, 
    ContractStatus
} from '@shared/models/contract.model';
import { ContractService } from '../../services/contract.service';

interface TotalValue {
    amount: number;
    currency: string;
}

interface ContractParty {
    name: string;
    role: string;
    address?: string;
}

interface ContractItem {
    name: string;
    description: string;
    quantity?: number;
    unit_price?: number;
}

interface ExtractedData {
    contract_number?: string;
    parties?: ContractParty[];
    payment_terms?: string;
    total_value?: TotalValue;
    effective_date?: string;
    expiration_date?: string;
    items?: ContractItem[];
}

@Component({
    selector: 'app-contract-view',
    templateUrl: './contract-view.component.html',
    styleUrls: ['./contract-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatIconModule
    ]
})
export class ContractViewComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly SNACKBAR_DURATION = 5000;

    viewForm!: FormGroup;
    contract: IContract = {} as IContract;
    isLoading = false;
    confidenceLevel: number = 0;

    // Document viewer properties
    documentUrl: SafeResourceUrl | null = null;
    contractId: string | null = null;
    zoomLevel = 1;
    minZoom = 0.5;
    maxZoom = 3;

    // Keyboard shortcuts
    readonly shortcuts = {
        zoomIn: 'Ctrl + +',
        zoomOut: 'Ctrl + -',
        resetZoom: 'Ctrl + 0',
        toggleShortcuts: '?'
    };

    private readonly snackBarConfig: MatSnackBarConfig = {
        duration: this.SNACKBAR_DURATION,
        horizontalPosition: 'right',
        verticalPosition: 'top'
    };

    constructor(
        private readonly fb: FormBuilder,
        private readonly contractService: ContractService,
        private readonly snackBar: MatSnackBar,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly cdr: ChangeDetectorRef,
        private readonly sanitizer: DomSanitizer
    ) {
        this.viewForm = this.initForm();
    }

    ngOnInit(): void {
        this.route.params.pipe(
            takeUntil(this.destroy$),
            map(params => params['id']),
            filter(id => !!id),
            tap(() => {
                this.isLoading = true;
                this.cdr.detectChanges();
            }),
            switchMap(id => {
                this.contractId = id;
                return this.contractService.getContract(id).pipe(
                    tap((contract: IContract) => {
                        this.contract = contract;
                        if (contract.file_path) {
                            const fullUrl = `${environment.s3BucketUrl}/${contract.file_path}`;
                            this.documentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
                        } else {
                            this.documentUrl = null;
                        }
                        this.confidenceLevel = contract.validation_notes?.confidence_level ? Number(contract.validation_notes.confidence_level) : 0;
                        
                        // Initialize form with the contract data
                        this.setInitialFormValues();
                        
                        this.cdr.detectChanges();
                    }),
                    catchError(error => {
                        this.showMessage('Error loading contract: ' + error.message, 'error');
                        return EMPTY;
                    })
                );
            })
        ).subscribe({
            next: () => {
                this.isLoading = false;
                this.setupKeyboardShortcuts();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.isLoading = false;
                this.showMessage('Error loading contract: ' + error.message, 'error');
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Document viewer methods
    zoomIn(): void {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel = Math.min(this.zoomLevel + 0.25, this.maxZoom);
        }
    }

    zoomOut(): void {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel = Math.max(this.zoomLevel - 0.25, this.minZoom);
        }
    }

    resetZoom(): void {
        this.zoomLevel = 1;
    }

    navigateBack(): void {
        this.router.navigate(['/contracts']);
    }

    navigateToValidate(): void {
        if (this.contractId) {
            this.router.navigate(['/contracts', this.contractId, 'validate']);
        }
    }

    createPurchaseOrder(): void {
        if (this.contractId && this.contract.status === 'VALIDATED') {
            this.router.navigate(['/purchase-orders/create'], {
                queryParams: { contractId: this.contractId }
            });
        }
    }

    getConfidenceClass(): string {
        if (this.confidenceLevel >= 90) {
            return 'high';
        } else if (this.confidenceLevel >= 70) {
            return 'medium';
        }
        return 'low';
    }

    getConfidenceIcon(): string {
        if (this.confidenceLevel >= 90) {
            return 'verified';
        } else if (this.confidenceLevel >= 70) {
            return 'thumb_up';
        }
        return 'warning';
    }

    get partiesFormArray(): FormArray {
        return this.viewForm.get('parties') as FormArray;
    }

    get itemsFormArray(): FormArray {
        return this.viewForm.get('items') as FormArray;
    }

    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.navigateBack();
            }
        });
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
        this.snackBar.open(message, 'Close', {
            ...this.snackBarConfig,
            panelClass: `snackbar-${type}`
        });
    }

    private initForm(): FormGroup {
        return this.fb.group({
            contract_number: [{value: '', disabled: true}],
            parties: this.fb.array([]),
            payment_terms: [{value: '', disabled: true}],
            total_value: [{value: null, disabled: true}],
            effective_date: [{value: '', disabled: true}],
            expiration_date: [{value: '', disabled: true}],
            items: this.fb.array([])
        });
    }

    private createPartyFormGroup(): FormGroup {
        return this.fb.group({
            name: [{value: '', disabled: true}],
            role: [{value: '', disabled: true}],
            address: [{value: '', disabled: true}]
        });
    }

    private createItemFormGroup(): FormGroup {
        return this.fb.group({
            name: [{value: '', disabled: true}],
            description: [{value: '', disabled: true}],
            quantity: [{value: null, disabled: true}],
            unit_price: [{value: null, disabled: true}]
        });
    }

    private setInitialFormValues(): void {
        if (!this.contract?.extracted_data) return;

        try {
            // Fix the type error by ensuring extracted_data is a string
            const extractedData = JSON.parse(typeof this.contract.extracted_data === 'string' 
                ? this.contract.extracted_data 
                : JSON.stringify(this.contract.extracted_data));
            
            // Set basic fields
            this.viewForm.patchValue({
                contract_number: extractedData.contract_number,
                payment_terms: extractedData.payment_terms,
                total_value: extractedData.total_value,
                effective_date: extractedData.effective_date,
                expiration_date: extractedData.expiration_date
            });

            // Set parties
            const partiesArray = this.viewForm.get('parties') as FormArray;
            partiesArray.clear();
            if (extractedData.parties && Array.isArray(extractedData.parties)) {
                extractedData.parties.forEach((party: any) => {
                    const partyGroup = this.createPartyFormGroup();
                    partyGroup.patchValue(party);
                    this.partiesFormArray.push(partyGroup);
                });
            }

            // Set items
            const itemsArray = this.viewForm.get('items') as FormArray;
            itemsArray.clear();
            if (extractedData.items && Array.isArray(extractedData.items)) {
                extractedData.items.forEach((item: any) => {
                    const itemGroup = this.createItemFormGroup();
                    itemGroup.patchValue(item);
                    itemsArray.push(itemGroup);
                });
            }

            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error parsing extracted data:', error);
            this.showMessage('Error loading contract data', 'error');
        }
    }
} 