/**
 * Production environment configuration for the Contract Processing System
 * Contains secure, optimized settings for production deployment
 * 
 * @version 1.0.0
 * @environment Production
 * @region AWS us-east-1 (Primary)
 */

export const environment = {
  // Core environment flag
  production: true,

  // Application Version
  version: '2.0.0',

  // API Endpoints with HTTPS enforcement
  apiUrl: 'https://vroozi-backend-pz5d.onrender.com/api/v1',
  googleVisionApiUrl: 'https://vision.googleapis.com/v1',
  s3BucketUrl: 'https://storage.contractprocessing.com',
  cdnUrl: 'https://cdn.contractprocessing.com',

  // API Rate Limiting (requests per minute per organization)
  apiRateLimit: 1000, // As per technical specification 3.3.2

  // Security Settings
  tokenExpiryTime: 3600, // JWT token expiry in seconds (1 hour)

  // File Upload Constraints
  maxFileSize: 25000000, // 25MB as per appendix A.1.2
  supportedFileTypes: [
    'application/pdf',           // PDF files
    'image/jpeg',               // JPEG images
    'image/png',                // PNG images
    'application/msword',       // DOC files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX files
  ],

  // AWS Configuration
  region: 'us-east-1', // Primary production region

  // Logging and Debug Settings
  logLevel: 'error', // Production logging level
  enableMocks: false // Disable mock data in production
};