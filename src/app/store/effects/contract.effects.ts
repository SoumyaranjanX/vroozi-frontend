// @angular/core v15.0.0
import { Injectable, OnDestroy } from '@angular/core';
// @ngrx/effects v15.0.0
import { Actions, createEffect, ofType } from '@ngrx/effects';
// rxjs v7.8.0
import { of, Subject, timer } from 'rxjs';
import { 
    catchError, 
    map, 
    mergeMap, 
    retry, 
    takeUntil, 
    timeout,
    switchMap
} from 'rxjs/operators';

import { ContractService } from '../../features/contracts/services/contract.service';
import { ContractStatus } from '../../shared/models/contract.model';
import {
    loadContracts,
    loadContractsSuccess,
    loadContractsFailure,
    uploadContract,
    uploadContractSuccess,
    uploadContractFailure,
    validateContract,
    validateContractSuccess,
    validateContractFailure,
    extractContractData,
    extractContractDataSuccess,
    extractContractDataFailure
} from '../actions/contract.actions';

/**
 * ContractEffects class handling all contract-related side effects
 * Implements comprehensive error handling, retry logic, and cleanup
 * @version 1.0.0
 */
@Injectable()
export class ContractEffects implements OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly RETRY_ATTEMPTS = 3;
    private readonly API_TIMEOUT = 30000; // 30 seconds

    /**
     * Effect handling contract loading with retry logic and error handling
     */
    loadContracts$ = createEffect(() => this.actions$.pipe(
        ofType(loadContracts),
        timeout(this.API_TIMEOUT),
        mergeMap(() => this.contractService.getContracts().pipe(
            retry({
                count: this.RETRY_ATTEMPTS,
                delay: (_, retryCount) => timer(Math.pow(2, retryCount) * 1000)
            }),
            map(contracts => loadContractsSuccess({ contracts })),
            catchError(error => {
                console.error('Error loading contracts:', error);
                return of(loadContractsFailure({ 
                    error: { 
                        message: error.message || 'Failed to load contracts',
                        code: error.status || 'UNKNOWN'
                    }
                }));
            })
        )),
        takeUntil(this.destroy$)
    ));

    /**
     * Effect handling contract upload with progress tracking and error handling
     */
    uploadContract$ = createEffect(() => this.actions$.pipe(
        ofType(uploadContract),
        timeout(this.API_TIMEOUT),
        mergeMap(action => this.contractService.uploadContract(action.contract).pipe(
            map((response: { type: string; progress?: number } | any) => {
                if ('type' in response && response.type === 'progress') {
                    return { type: '[Contract] Upload Progress', progress: response.progress || 0 };
                }
                return uploadContractSuccess({ contract: response });
            }),
            retry({
                count: this.RETRY_ATTEMPTS,
                delay: (_, retryCount) => timer(Math.pow(2, retryCount) * 1000),
                resetOnSuccess: true
            }),
            catchError(error => {
                console.error('Error uploading contract:', error);
                return of(uploadContractFailure({
                    error: {
                        message: error.message || 'Failed to upload contract',
                        code: error.status || 'UNKNOWN'
                    }
                }));
            })
        )),
        takeUntil(this.destroy$)
    ));

    /**
     * Effect handling OCR processing with status polling
     */
    processContract$ = createEffect(() => this.actions$.pipe(
        ofType(extractContractData),
        timeout(this.API_TIMEOUT),
        mergeMap(action => this.contractService.processContract(action.id).pipe(
            switchMap(({ task_id }) => {
                // First update contract status to PROCESSING
                return this.contractService.updateContractStatus(action.id, ContractStatus.PROCESSING).pipe(
                    // Then start polling for OCR status
                    switchMap(() => this.contractService.pollOcrStatus(task_id).pipe(
                        map(response => {
                            if (response.status === 'ERROR') {
                                throw new Error('OCR processing failed');
                            }
                            return response;
                        }),
                        // When OCR is complete, update contract status to VALIDATION_REQUIRED
                        switchMap(response => this.contractService.updateContractStatus(
                            action.id,
                            ContractStatus.VALIDATION_REQUIRED,
                            response.result
                        )),
                        map(contract => extractContractDataSuccess({
                            contract,
                            extractedData: contract.extracted_data
                        }))
                    ))
                );
            }),
            catchError(error => of(extractContractDataFailure({
                id: action.id,
                error: {
                    message: error.message || 'Failed to process contract',
                    code: error.status || 'UNKNOWN'
                }
            })))
        ))
    ));

    /**
     * Effect handling OCR validation and confidence check
     */
    validateContract$ = createEffect(() => this.actions$.pipe(
        ofType(validateContract),
        timeout(this.API_TIMEOUT),
        mergeMap(action => this.contractService.validateOcr(action.id).pipe(
            switchMap(({ confidence, data }) => {
                // Update contract status to VALIDATED
                return this.contractService.updateContractStatus(
                    action.id,
                    ContractStatus.VALIDATED,
                    { ...data, confidence }
                ).pipe(
                    map(contract => validateContractSuccess({
                        contract,
                        status: ContractStatus.VALIDATED
                    }))
                );
            }),
            catchError(error => of(validateContractFailure({
                id: action.id,
                error: {
                    message: error.message || 'Failed to validate contract',
                    code: error.status || 'UNKNOWN'
                }
            })))
        ))
    ));

    constructor(
        private readonly actions$: Actions,
        private readonly contractService: ContractService
    ) {}

    /**
     * Cleanup method to prevent memory leaks
     */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}