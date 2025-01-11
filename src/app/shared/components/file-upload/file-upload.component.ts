import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    SharedModule
  ]
})
export class FileUploadComponent {
  @Input() accept = '*/*';
  @Input() multiple = false;
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB
  @Input() maxBatchSize = 50 * 1024 * 1024; // 50MB
  @Input() autoUpload = false;
  @Input() allowedTypes: string[] = [];

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadProgress = new EventEmitter<number>();
  @Output() uploadComplete = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<Error>();
  @Output() invalidFiles = new EventEmitter<File[]>();
  @Output() dragStateChange = new EventEmitter<boolean>();

  files: File[] = [];
  dragOver = false;
  uploading = false;
  uploadProgressValue = 0;
  isDragging = false;
  status: 'pending' | 'uploading' | 'completed' | 'error' = 'pending';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
    this.isDragging = true;
    this.dragStateChange.emit(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    this.isDragging = false;
    this.dragStateChange.emit(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    this.isDragging = false;
    this.dragStateChange.emit(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onFilesDropped(files: File[]): void {
    this.handleFiles(files);
  }

  onInvalidFiles(files: File[]): void {
    this.invalidFiles.emit(files);
  }

  onDragStateChange(isDragging: boolean): void {
    this.isDragging = isDragging;
    this.dragStateChange.emit(isDragging);
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'uploading':
        return 'cloud_upload';
      default:
        return 'cloud_upload';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Upload completed';
      case 'error':
        return 'Upload failed';
      case 'uploading':
        return 'Uploading...';
      default:
        return 'Ready to upload';
    }
  }

  private handleFiles(files: File[]): void {
    // Filter files based on size and type
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    files.forEach(file => {
      const isValidSize = file.size <= this.maxFileSize;
      const isValidType = this.allowedTypes.length === 0 || 
        this.allowedTypes.includes(file.type) || 
        file.type.match(this.accept);

      if (isValidSize && isValidType) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      this.invalidFiles.emit(invalidFiles);
    }

    if (!this.multiple) {
      // If multiple is false, only take the first valid file
      this.files = validFiles.slice(0, 1);
    } else {
      // Add new valid files to existing files
      this.files = [...this.files, ...validFiles];
    }

    // Check batch size
    const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.maxBatchSize) {
      this.uploadError.emit(new Error('Total file size exceeds maximum batch size'));
      this.files = [];
      return;
    }

    this.filesSelected.emit(this.files);

    if (this.autoUpload) {
      this.startUpload();
    }
  }

  startUpload(): void {
    if (this.files.length === 0) {
      return;
    }

    this.uploading = true;
    this.uploadProgressValue = 0;
    this.status = 'uploading';

    // Simulate upload progress
    const interval = setInterval(() => {
      this.uploadProgressValue += 10;
      this.uploadProgress.emit(this.uploadProgressValue);

      if (this.uploadProgressValue >= 100) {
        clearInterval(interval);
        this.uploading = false;
        this.status = 'completed';
        this.uploadComplete.emit();
        this.files = [];
      }
    }, 500);
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.filesSelected.emit(this.files);
  }

  clearFiles(): void {
    this.files = [];
    this.filesSelected.emit(this.files);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}