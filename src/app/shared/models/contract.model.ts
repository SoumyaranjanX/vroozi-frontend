// crypto UUID type - v4.x.x
import { UUID } from 'crypto';

/**
 * Allowed file types for contract uploads
 * Supports PDF, Word documents, and common image formats
 */
export type AllowedFileType = typeof FILE_TYPES_ALLOWED[number];

export const FILE_TYPES_ALLOWED = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
] as const;

/**
 * Maximum file size for contract uploads (25MB)
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Enumeration of possible contract processing states
 * Used for tracking contract lifecycle and status management
 */
export const ContractStatus = {
    PENDING: 'PENDING',               // Initial state after upload
    PROCESSING: 'PROCESSING',         // OCR/data extraction in progress
    VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',  // Needs human validation
    VALIDATED: 'VALIDATED',           // Validation completed
    FAILED: 'FAILED',                // Processing/validation failed
    COMPLETED: 'COMPLETED'           // Final state
} as const;

export type ContractStatus = typeof ContractStatus[keyof typeof ContractStatus];

/**
 * Core contract interface representing a contract in the system
 * Includes comprehensive metadata and processing information
 */
export interface IContract {
    /** Unique identifier for the contract */
    readonly id: string;
    
    /** Path to the stored contract file */
    readonly file_path: string;
    
    /** Current processing status */
    status: ContractStatus;
    
    /** Additional contract metadata */
    metadata: Record<string, unknown>;
    
    /** User ID who created the contract */
    readonly created_by: string;
    
    /** Contract creation timestamp */
    readonly created_at: string;
    
    /** Last update timestamp */
    updated_at: string;
    
    /** Extracted contract data from OCR processing */
    extracted_data: Record<string, unknown>;
    
    /** Notes and comments from validation process */
    validation_notes: Record<string, unknown>;
    
    /** Error details if processing failed */
    error_details: Record<string, unknown>;
    
    /** Associated purchase order numbers */
    readonly po_numbers: readonly string[];
}

/**
 * Interface for contract upload operations
 * Ensures type safety during file upload process
 */
export interface IContractUpload {
    /** File object for upload */
    file: File;
    
    /** Optional metadata for the contract */
    metadata: {
        originalName: string;
        size: number;
        type: AllowedFileType;
        [key: string]: unknown;
    };
}

/**
 * Interface for contract update operations
 * Supports partial updates with type safety
 */
export interface IContractUpdate {
    /** Updated contract status */
    status?: ContractStatus;
    
    /** Updated metadata */
    metadata?: Record<string, unknown>;
    
    /** Updated extracted data */
    extracted_data?: Record<string, unknown>;
    
    /** Updated validation notes */
    validation_notes?: Record<string, unknown>;
}

/**
 * Interface for upload progress event
 */
export interface IUploadProgressEvent {
    loaded: number;
    total: number;
}