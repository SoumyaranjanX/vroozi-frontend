/**
 * Staging Environment Configuration
 * Version: 1.0.0
 * 
 * This file contains environment-specific configuration variables for the staging environment
 * of the Contract Processing and Purchase Order Generation System.
 * 
 * Note: This configuration is used for pre-production testing and validation.
 */

export const environment = {
  // Indicates if this is a production build
  production: false,

  // Application Version
  version: '2.0.0',

  // Base URL for backend API endpoints
  // Rate limit: 500 requests/minute per organization
  apiUrl: 'https://staging-api.contractprocessing.com/api/v1',

  // Google Vision API endpoint for OCR processing
  // API Version: v1
  googleVisionApiUrl: 'https://vision.googleapis.com/v1',

  // S3 bucket URL for document storage
  // Configured with versioning enabled and standard tier storage
  s3BucketUrl: 'https://staging-storage.contractprocessing.com',

  // API rate limiting configuration (requests per minute)
  // Aligned with technical specification section 3.3.2
  apiRateLimit: 500,

  // JWT token expiry time in seconds (1 hour)
  // Aligned with security specifications in section 7.1.1
  tokenExpiryTime: 3600,

  // Maximum file size for uploads in bytes (25MB)
  // Aligned with appendix A.1.2 File Processing Limits
  maxFileSize: 25000000,

  // Supported file types for document upload
  // Aligned with technical specification section 1.3
  supportedFileTypes: [
    'application/pdf',           // PDF documents
    'image/jpeg',               // JPEG images
    'image/png',                // PNG images
    'application/msword',       // DOC files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX files
  ],

  // Logging level for application monitoring
  // Options: debug, info, warn, error
  logLevel: 'info',

  // Feature flag for mock services
  // Should be false in staging for real service testing
  enableMocks: false
};