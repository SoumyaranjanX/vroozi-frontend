import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpErrorResponse, HttpHeaders, HttpRequest, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, throwError, Subject, interval } from 'rxjs';
import { catchError, map, tap, retry, shareReplay, takeUntil, switchMap, filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
    IContract,
    IContractUpload,
    IContractUpdate,
    ContractStatus,
    FILE_TYPES_ALLOWED,
    MAX_FILE_SIZE,
    AllowedFileType
} from '@shared/models/contract.model';
import { AuthService } from '@core/auth/auth.service';

/**
 * Service responsible for handling contract-related operations
 * Implements comprehensive error handling, caching, and file validation
 * @version 1.0.0
 */
@Injectable({
    providedIn: 'root'
})
export class ContractService {
    private readonly apiUrl = `${environment.apiUrl}/contracts`;
    private readonly ocrUrl = `${environment.apiUrl}/ocr`;
    private readonly destroy$ = new Subject<void>();
    private contractsCache$?: Observable<IContract[]>;

    // Maximum retry attempts for failed requests
    private readonly MAX_RETRIES = 3;
    private readonly POLLING_INTERVAL = 5000; // 5 seconds

    constructor(
        private readonly http: HttpClient,
        private readonly authService: AuthService
    ) {}

    /**
     * Retrieves a cached list of contracts
     * Implements caching with invalidation on updates
     * @returns Observable<IContract[]> Stream of contracts
     */
    getContracts(): Observable<IContract[]> {
        if (!this.contractsCache$) {
            this.contractsCache$ = this.http.get<IContract[]>(this.apiUrl).pipe(
                retry(this.MAX_RETRIES),
                map(contracts => contracts.map(contract => this.transformContract(contract))),
                map(contracts => contracts.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )),
                shareReplay(1),
                takeUntil(this.destroy$),
                catchError(this.handleError)
            );
        }
        return this.contractsCache$;
    }

    /**
     * Transforms raw contract data from backend to frontend format
     * @param contract Raw contract data from backend
     * @returns Transformed contract data
     */
    private transformContract(contract: any): IContract {
        return {
            id: contract.id || contract._id,
            file_path: contract.file_path,
            status: contract.status,
            metadata: contract.metadata || {},
            created_by: contract.created_by,
            created_at: contract.created_at,
            updated_at: contract.updated_at,
            extracted_data: contract.extracted_data || {},
            validation_notes: contract.validation_notes || {},
            error_details: contract.error_details || {},
            po_numbers: contract.po_numbers || []
        };
    }

    /**
     * Uploads a new contract file with metadata
     * @param contract Contract upload data containing file and metadata
     * @returns Observable of the upload progress and response
     */
    uploadContract(contract: IContractUpload): Observable<HttpEvent<IContract>> {
        return new Observable(observer => {
            const formData = new FormData();
            
            // Append file with specific name
            formData.append('file', contract.file);
            
            // Add metadata fields individually
            formData.append('metadata.contract_type', 'purchase');
            formData.append('metadata.department', 'procurement');
            formData.append('metadata.priority', 'normal');
            formData.append('metadata.original_name', contract.file.name);
            formData.append('metadata.file_size', contract.file.size.toString());
            formData.append('metadata.file_type', contract.file.type);
            formData.append('metadata.status', 'UPLOADED');

            const xhr = new XMLHttpRequest();
            
            // Handle progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    observer.next({
                        type: HttpEventType.UploadProgress,
                        loaded: event.loaded,
                        total: event.total
                    } as HttpEvent<IContract>);
                }
            };

            // Handle response
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = new HttpResponse<IContract>({
                        body: JSON.parse(xhr.response),
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: new HttpHeaders(xhr.getAllResponseHeaders()),
                        url: xhr.responseURL
                    });
                    observer.next(response);
                    observer.complete();
                    this.invalidateCache();
                } else {
                    observer.error(new HttpErrorResponse({
                        error: xhr.response,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        url: xhr.responseURL
                    }));
                }
            };

            // Handle error
            xhr.onerror = () => {
                observer.error(new HttpErrorResponse({
                    error: xhr.response,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    url: xhr.responseURL
                }));
            };

            // Open and send request
            xhr.open('POST', this.apiUrl, true);
            xhr.setRequestHeader('Authorization', `Bearer ${this.authService.getToken()}`);
            xhr.withCredentials = true;  // Enable CORS with credentials
            xhr.responseType = 'json';   // Set response type to JSON
            xhr.send(formData);

            // Cleanup
            return () => {
                xhr.abort();
            };
        });
    }

    /**
     * Validates a contract with provided data
     * @param id Contract ID to validate
     * @param data Contract validation data
     * @returns Observable<IContract> Updated contract
     */
    validateContract(id: string, data: IContractUpdate): Observable<IContract> {
        return this.http.patch<IContract>(`${this.apiUrl}/${id}/validate`, data).pipe(
            tap(() => this.invalidateCache()),
            catchError(this.handleError)
        );
    }

    /**
     * Invalidates the contracts cache
     * Forces next getContracts() call to fetch fresh data
     */
    private invalidateCache(): void {
        this.contractsCache$ = undefined;
    }

    /**
     * Generic error handler for HTTP operations
     * @param error Error object from failed request
     * @returns Observable that errors with formatted message
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }

        return throwError(() => new Error(errorMessage));
    }

    /**
     * Starts OCR processing for a contract
     * @param id Contract ID to process
     * @returns Observable<{ task_id: string }>
     */
    processContract(id: string): Observable<{ task_id: string }> {
        return this.http.post<{ task_id: string }>(`${this.ocrUrl}/process`, { contract_id: id }).pipe(
            retry(this.MAX_RETRIES),
            catchError(this.handleError)
        );
    }

    /**
     * Checks OCR processing status
     * @param taskId Task ID to check status for
     * @returns Observable<{ status: string, result?: any }>
     */
    checkOcrStatus(taskId: string): Observable<{ status: string, result?: any }> {
        return this.http.get<{ status: string, result?: any }>(`${this.ocrUrl}/status/${taskId}`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Polls OCR status until completion
     * @param taskId Task ID to poll
     * @returns Observable that completes when processing is done
     */
    pollOcrStatus(taskId: string): Observable<{ status: string, result?: any }> {
        return interval(this.POLLING_INTERVAL).pipe(
            switchMap(() => this.checkOcrStatus(taskId)),
            filter(response => ['COMPLETED', 'ERROR'].includes(response.status)),
            takeUntil(this.destroy$)
        );
    }

    /**
     * Validates OCR results for a contract
     * @param id Contract ID to validate
     * @returns Observable<{ confidence: number, data: any }>
     */
    validateOcr(id: string): Observable<{ confidence: number, data: any }> {
        return this.http.post<{ confidence: number, data: any }>(`${this.ocrUrl}/validate`, { contract_id: id }).pipe(
            retry(this.MAX_RETRIES),
            catchError(this.handleError)
        );
    }

    /**
     * Updates contract status and extracted data
     * @param id Contract ID to update
     * @param status New status
     * @param extractedData Optional extracted data
     * @returns Observable<IContract>
     */
    updateContractStatus(id: string, status: ContractStatus, extractedData?: any): Observable<IContract> {
        const update: IContractUpdate = {
            status,
            extracted_data: extractedData
        };
        return this.http.patch<IContract>(`${this.apiUrl}/${id}`, update).pipe(
            tap(() => this.invalidateCache()),
            catchError(this.handleError)
        );
    }

    /**
     * Retrieves a single contract by ID
     * @param id Contract ID to retrieve
     * @returns Observable<IContract>
     */
    getContract(id: string): Observable<IContract> {
        return this.http.get<IContract>(`${this.apiUrl}/${id}`).pipe(
            retry(this.MAX_RETRIES),
            catchError(this.handleError)
        );
    }
}