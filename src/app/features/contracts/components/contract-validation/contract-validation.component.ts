import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, map, filter, tap, switchMap, catchError, EMPTY } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { 
    IContract, 
    IContractUpdate, 
    ContractStatus
} from '@shared/models/contract.model';
import { ContractService } from '../../services/contract.service';

interface TotalValue {
    amount: number;
    currency: string;
}

@Component({
    selector: 'app-contract-validation',
    templateUrl: './contract-validation.component.html',
    styleUrls: ['./contract-validation.component.scss'],
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
export class ContractValidationComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly DEBOUNCE_TIME = 500;
    private readonly SNACKBAR_DURATION = 5000;

    validationForm!: FormGroup;
    contract: IContract = {} as IContract;
    isLoading = false;
    hasChanges = false;
    validationProgress = 0;
    validationErrors: string[] = [];
    isSubmitting = false;
    confidenceLevel: number = 0;

    // Document viewer properties
    documentUrl: string | null = null;
    contractId: string | null = null;
    zoomLevel = 1;
    minZoom = 0.5;
    maxZoom = 3;

    // UI state
    showKeyboardShortcuts = false;
    validationMessage: string | null = null;
    validationMessageType: 'success' | 'error' | 'info' = 'info';

    // Keyboard shortcuts
    readonly shortcuts = {
        save: 'Ctrl + S',
        cancel: 'Esc',
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
        private readonly cdr: ChangeDetectorRef
    ) {
        this.validationForm = this.initForm();
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
                console.log('Fetching contract:', id); // Debug log
                return this.contractService.getContract(id).pipe(
                    tap((contract: IContract) => {
                        console.log('Contract data received:', contract); // Debug log
                        this.contract = contract;
                        this.documentUrl = contract.file_path;
                        this.confidenceLevel = contract.validation_notes?.confidence_level ? Number(contract.validation_notes.confidence_level) : 0;
                        
                        // Initialize form with the contract data
                        this.setInitialFormValues();
                        
                        this.cdr.detectChanges();
                    }),
                    catchError(error => {
                        console.error('Contract fetch error:', error); // Debug log
                        this.showMessage('Error loading contract: ' + error.message, 'error');
                        return EMPTY;
                    })
                );
            })
        ).subscribe({
            next: () => {
                console.log('Form values after initialization:', this.validationForm.value); // Debug log
                this.isLoading = false;
                this.setupFormValidation();
                this.setupKeyboardShortcuts();
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Subscription error:', error); // Debug log
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

    // Form methods
    isFieldInvalid(fieldName: string): boolean {
        const field = this.validationForm.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }

    resetForm(): void {
        if (this.contract?.extracted_data) {
            this.setInitialFormValues();
        } else {
            this.validationForm.reset();
        }
        this.hasChanges = false;
    }

    cancelValidation(): void {
        if (this.hasChanges) {
            // Show confirmation dialog
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                this.navigateBack();
            }
        } else {
            this.navigateBack();
        }
    }

    toggleKeyboardShortcuts(): void {
        this.showKeyboardShortcuts = !this.showKeyboardShortcuts;
    }

    saveChanges(): void {
        if (this.validationForm.valid && !this.isSubmitting && this.contractId) {
            this.isSubmitting = true;
            const update: IContractUpdate = {
                extracted_data: {
                    ...this.validationForm.value,
                }
            };

            this.contractService.updateContractStatus(
                this.contractId,
                ContractStatus.VALIDATION_REQUIRED,
                update.extracted_data
            ).pipe(
                takeUntil(this.destroy$)
            ).subscribe({
                next: (updatedContract) => {
                    this.contract = updatedContract;
                    this.showMessage('Changes saved successfully', 'success');
                    this.isSubmitting = false;
                    this.hasChanges = false;
                    this.cdr.detectChanges();
                },
                error: (error: HttpErrorResponse) => {
                    this.showMessage('Failed to save changes: ' + error.message, 'error');
                    this.isSubmitting = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    submitValidation(): void {
        if (this.validationForm.valid && !this.isSubmitting && this.contractId) {
            this.isSubmitting = true;
            
            // Use the same format as saveChanges
            const update: IContractUpdate = {
                extracted_data: {
                    ...this.validationForm.value,
                    validation_notes: {
                        reviewer: 'current_user', // TODO: Get from auth service
                        comments: 'Contract validated successfully',
                        validated_at: new Date().toISOString()
                    }
                }
            };

            this.contractService.updateContractStatus(
                this.contractId,
                ContractStatus.VALIDATED,
                update.extracted_data
            ).pipe(
                takeUntil(this.destroy$)
            ).subscribe({
                next: (updatedContract) => {
                    this.contract = updatedContract;
                    this.showMessage('Contract validation successful', 'success');
                    this.isSubmitting = false;
                    this.navigateBack();
                },
                error: (error: HttpErrorResponse) => {
                    this.showMessage('Failed to validate contract: ' + error.message, 'error');
                    this.isSubmitting = false;
                }
            });
        }
    }

    rejectContract(): void {
        if (this.contractId) {
            this.isSubmitting = true;
            this.contractService.updateContractStatus(
                this.contractId,
                ContractStatus.FAILED,
                {
                    rejection_reason: this.validationForm.get('rejection_reason')?.value,
                    rejected_at: new Date().toISOString(),
                    rejected_by: 'current_user' // TODO: Get from auth service
                }
            ).pipe(
                takeUntil(this.destroy$)
            ).subscribe({
                next: () => {
                    this.showMessage('Contract rejected', 'info');
                    this.navigateBack();
                },
                error: (error: HttpErrorResponse) => {
                    this.showMessage('Failed to reject contract: ' + error.message, 'error');
                    this.isSubmitting = false;
                }
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

    private setupFormValidation(): void {
        this.validationForm.valueChanges
            .pipe(
                takeUntil(this.destroy$),
                debounceTime(this.DEBOUNCE_TIME),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.hasChanges = true;
                this.validateForm();
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
            this.validationForm.patchValue({
                contract_number: extractedData.contract_number,
                payment_terms: extractedData.payment_terms,
                total_value: extractedData.total_value,
                effective_date: extractedData.effective_date,
                expiration_date: extractedData.expiration_date
            });

            // Set parties
            const partiesArray = this.validationForm.get('parties') as FormArray;
            partiesArray.clear();
            if (extractedData.parties && Array.isArray(extractedData.parties)) {
                extractedData.parties.forEach((party: any) => {
                    partiesArray.push(this.fb.group({
                        name: [party.name, Validators.required],
                        role: [party.role, Validators.required],
                        address: [party.address]
                    }));
                });
            }

            // Set items
            const itemsArray = this.validationForm.get('items') as FormArray;
            itemsArray.clear();
            if (extractedData.items && Array.isArray(extractedData.items)) {
                extractedData.items.forEach((item: any) => {
                    itemsArray.push(this.fb.group({
                        name: [item.name, Validators.required],
                        description: [item.description, Validators.required],
                        quantity: [item.quantity],
                        unit_price: [item.unit_price]
                    }));
                });
            }

            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error parsing extracted data:', error);
            this.showMessage('Error loading contract data', 'error');
        }
    }

    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.submitValidation();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelValidation();
            } else if (event.key === '?') {
                event.preventDefault();
                this.toggleKeyboardShortcuts();
            }
        });
    }

    private validateForm(): void {
        this.validationErrors = [];
        Object.keys(this.validationForm.controls).forEach(key => {
            const control = this.validationForm.get(key);
            if (control?.errors) {
                Object.keys(control.errors).forEach(errorKey => {
                    this.validationErrors.push(`${key}: ${this.getErrorMessage(errorKey)}`);
                });
            }
        });
    }

    private getErrorMessage(errorKey: string): string {
        const errorMessages: { [key: string]: string } = {
            required: 'This field is required',
            email: 'Invalid email format',
            min: 'Value is below minimum',
            max: 'Value exceeds maximum',
            pattern: 'Invalid format'
        };
        return errorMessages[errorKey] || 'Invalid value';
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
        this.validationMessage = message;
        this.validationMessageType = type;
        this.snackBar.open(message, 'Close', {
            ...this.snackBarConfig,
            panelClass: `snackbar-${type}`
        });
    }

    navigateBack(): void {
        this.router.navigate(['/contracts']);
    }

    private initForm(): FormGroup {
        return this.fb.group({
            contract_number: ['', Validators.required],
            parties: this.fb.array([]),
            payment_terms: [[]],
            total_value: [null, [Validators.required, Validators.min(0)]],
            effective_date: ['', Validators.required],
            expiration_date: ['', Validators.required],
            items: this.fb.array([]),
            rejection_reason: ['']
        });
    }

    private createItemFormGroup(): FormGroup {
        return this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            quantity: [null],
            unit_price: [null]
        });
    }

    get itemsFormArray(): FormArray {
        return this.validationForm.get('items') as FormArray;
    }

    addItem(): void {
        this.itemsFormArray.push(this.createItemFormGroup());
        this.hasChanges = true;
    }

    removeItem(index: number): void {
        this.itemsFormArray.removeAt(index);
        this.hasChanges = true;
    }

    // Helper method to get form control error state
    getFieldError(fieldPath: string): string {
        const control = this.validationForm.get(fieldPath);
        if (control?.errors && (control.dirty || control.touched)) {
            if (control.errors['required']) return 'This field is required';
            if (control.errors['min']) return 'Value must be greater than 0';
        }
        return '';
    }

    private createPartyFormGroup(): FormGroup {
        return this.fb.group({
            name: ['', Validators.required],
            role: ['', Validators.required],
            address: ['']
        });
    }

    get partiesFormArray(): FormArray {
        return this.validationForm.get('parties') as FormArray;
    }

    addParty(): void {
        this.partiesFormArray.push(this.createPartyFormGroup());
        this.hasChanges = true;
    }

    removeParty(index: number): void {
        this.partiesFormArray.removeAt(index);
        this.hasChanges = true;
    }
}