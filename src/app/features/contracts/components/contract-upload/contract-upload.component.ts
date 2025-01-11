// @angular/core v15.0.0
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Output, 
  EventEmitter, 
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// @angular/common/http v15.0.0
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';

// rxjs v7.8.0
import { 
  forkJoin, 
  Subject, 
  Observable,
  of,
  throwError,
  BehaviorSubject,
  retry,
  filter
} from 'rxjs';
import { 
  takeUntil, 
  catchError, 
  finalize, 
  map,
  concatMap,
  tap
} from 'rxjs/operators';

// Internal imports
import { ContractService } from '../../services/contract.service';
import { ErrorHandlerService } from '../../../../shared/services/error-handler.service';
import { 
  FILE_TYPES_ALLOWED, 
  MAX_FILE_SIZE, 
  IContractUpload,
  AllowedFileType,
  IUploadProgressEvent,
  IContract,
  ContractStatus
} from '../../../../shared/models/contract.model';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

interface UploadQueueItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

@Component({
  selector: 'app-contract-upload',
  templateUrl: './contract-upload.component.html',
  styleUrls: ['./contract-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ]
})
export class ContractUploadComponent implements OnInit, OnDestroy {
  // Constants
  private readonly PARALLEL_UPLOAD_LIMIT = 3;
  private readonly MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  // Component state
  uploadQueue: Map<string, UploadQueueItem> = new Map();
  uploading = false;
  totalProgress = 0;
  validationErrors: string[] = [];
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | 'info' = 'info';
  dragOver = false;
  files: File[] = [];
  status: 'idle' | 'uploading' | 'completed' | 'error' = 'idle';
  
  // Configuration
  autoUpload = true;
  accept = FILE_TYPES_ALLOWED.join(',');
  multiple = true;
  maxFileSize = MAX_FILE_SIZE;
  allowedTypes = FILE_TYPES_ALLOWED;

  // Observables
  private uploadProgress$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Event emitters
  @Output() uploadComplete = new EventEmitter<void>();
  @Output() fileQueueUpdated = new EventEmitter<File[]>();
  @Output() uploadError = new EventEmitter<string>();

  constructor(
    private contractService: ContractService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.uploadProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.totalProgress = progress;
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.setupDragAndDrop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDragAndDrop(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('dragover', (e) => e.preventDefault());
      window.addEventListener('drop', (e) => e.preventDefault());
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFileSelection(Array.from(files));
    }
    this.cdr.markForCheck();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFileSelection(Array.from(input.files));
    }
  }

  private handleFileSelection(newFiles: File[]): void {
    const validFiles = newFiles.filter(file => {
      const isValidType = this.isAllowedFileType(file.type);
      const isValidSize = this.isAllowedFileSize(file.size);

      if (!isValidType) {
        this.showError(`File "${file.name}" has an unsupported format`);
      }
      if (!isValidSize) {
        this.showError(`File "${file.name}" exceeds the maximum size limit of ${this.formatFileSize(this.maxFileSize)}`);
      }

      return isValidType && isValidSize;
    });

    const totalSize = [...this.files, ...validFiles].reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.MAX_TOTAL_SIZE) {
      this.showError(`Total file size exceeds the maximum limit of ${this.formatFileSize(this.MAX_TOTAL_SIZE)}`);
      return;
    }

    this.files = [...this.files, ...validFiles];
    this.fileQueueUpdated.emit(this.files);

    if (this.autoUpload && validFiles.length > 0) {
      this.uploadFiles();
    }
  }

  removeFile(index: number): void {
    const file = this.files[index];
    this.files.splice(index, 1);
    this.uploadQueue.delete(file.name);
    this.fileQueueUpdated.emit(this.files);
    this.updateTotalProgress();
    this.cdr.markForCheck();
  }

  uploadFiles(): void {
    if (this.files.length === 0 || this.uploading) return;

    this.uploading = true;
    this.status = 'uploading';
    this.updateUploadQueue();

    const chunkedUploads = this.chunkArray(this.files, this.PARALLEL_UPLOAD_LIMIT);
    
    of(...chunkedUploads).pipe(
      concatMap(chunk => forkJoin(
        chunk.map(file => this.uploadFile(file))
      )),
      takeUntil(this.destroy$),
      finalize(() => {
        this.uploading = false;
        this.status = this.uploadQueue.size === this.files.length ? 'completed' : 'error';
        this.uploadComplete.emit();
        this.cdr.markForCheck();

        if (this.status === 'completed') {
          this.showSuccess('All files uploaded successfully');
          this.files = [];
          this.uploadQueue.clear();
        }
      })
    ).subscribe({
      error: (error) => {
        this.status = 'error';
        this.showError('Upload failed. Please try again.');
        this.uploadError.emit(error.message);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Uploads a single file with metadata and handles progress
   * @param file File to upload
   * @returns Observable of the upload result
   */
  private uploadFile(file: File): Observable<IContract> {
    const upload: IContractUpload = {
      file,
      metadata: {
        originalName: file.name,
        size: file.size,
        type: file.type as AllowedFileType,
        contract_type: 'purchase',
        department: 'procurement',
        priority: 'normal',
        status: ContractStatus.PENDING
      }
    };

    return this.contractService.uploadContract(upload).pipe(
      tap((event: HttpEvent<IContract>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          this.updateFileProgress(file, progress);
        }
        if (event.type === HttpEventType.Response) {
          this.updateFileStatus(file, 'completed');
          this.showSuccess(`Successfully uploaded ${file.name}`);
        }
      }),
      filter((event: HttpEvent<IContract>) => event.type === HttpEventType.Response),
      map((event: HttpEvent<IContract>) => (event as HttpResponse<IContract>).body!),
      catchError((error: HttpErrorResponse) => this.handleUploadError(error, file))
    );
  }

  private handleUploadError(error: HttpErrorResponse, file: File): Observable<never> {
    const errorMessage = error.error?.message || error.message || 'Upload failed';
    this.updateFileStatus(file, 'error', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private updateUploadQueue(): void {
    this.files.forEach(file => {
      if (!this.uploadQueue.has(file.name)) {
        this.uploadQueue.set(file.name, {
          file,
          progress: 0,
          status: 'pending'
        });
      }
    });
  }

  private updateFileProgress(file: File, progress: number): void {
    const item = this.uploadQueue.get(file.name);
    if (item) {
      item.progress = progress;
      item.status = 'uploading';
      this.updateTotalProgress();
      this.cdr.markForCheck();
    }
  }

  private updateFileStatus(file: File, status: UploadQueueItem['status'], error?: string): void {
    const item = this.uploadQueue.get(file.name);
    if (item) {
      item.status = status;
      if (error) item.error = error;
      if (status === 'completed') item.progress = 100;
      this.updateTotalProgress();
      this.cdr.markForCheck();
    }
  }

  private updateTotalProgress(): void {
    const items = Array.from(this.uploadQueue.values());
    if (items.length === 0) {
      this.uploadProgress$.next(0);
      return;
    }

    const totalProgress = items.reduce((sum, item) => sum + item.progress, 0);
    this.uploadProgress$.next(Math.round(totalProgress / items.length));
  }

  private showSuccess(message: string): void {
    this.alertMessage = message;
    this.alertType = 'success';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string): void {
    this.alertMessage = message;
    this.alertType = 'error';
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  private isAllowedFileType(type: string): boolean {
    return FILE_TYPES_ALLOWED.includes(type as AllowedFileType);
  }

  private isAllowedFileSize(size: number): boolean {
    return size <= MAX_FILE_SIZE;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'uploading':
        return 'Uploading files...';
      case 'completed':
        return 'All files uploaded successfully';
      case 'error':
        return 'Some files failed to upload';
      default:
        return 'Ready to upload';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}