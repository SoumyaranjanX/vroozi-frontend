/**
 * Development Environment Configuration
 * Version: 1.0.0
 * 
 * This file contains environment-specific configuration for the Contract Processing System
 * frontend application in development mode. It includes API endpoints, security parameters,
 * rate limiting settings, and feature flags.
 */

export const environment = {
  // Environment type flag
  production: false,

  // Application Version
  version: '2.0.0',

  // API Endpoints
  apiUrl: 'https://vroozi-backend-pz5d.onrender.com/api/v1',
  googleVisionApiUrl: 'https://vision.googleapis.com/v1', // Google Cloud Vision API v1
  s3BucketUrl: 'http://localhost:9000', // Local MinIO S3-compatible storage

  // API Rate Limiting Configuration
  apiRateLimit: {
    requestsPerMinute: 100, // Base rate limit per client
    burstAllowance: 20, // Percentage of additional burst capacity
    perUserLimit: 50, // Individual user request limit
    perOrgLimit: 1000 // Organization-wide request limit
  },

  // Token Configuration
  tokenConfig: {
    accessTokenExpiry: 3600, // 1 hour in seconds
    refreshTokenExpiry: 604800, // 7 days in seconds
    tokenType: 'Bearer',
    issuer: 'contract-processing-system'
  },

  // File Upload Configuration
  fileConfig: {
    maxSingleFileSize: 25_000_000, // 25MB in bytes
    maxBulkUploadSize: 500_000_000, // 500MB in bytes
    supportedFileTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFilesPerBatch: 50
  },

  // Logging Configuration
  logging: {
    level: 'debug', // Enhanced logging for development
    enableConsole: true, // Enable console logging
    enableFileLogging: true, // Enable file logging
    logFilePath: './logs/app.log',
    maxLogFileSize: 10_485_760 // 10MB in bytes
  },

  // Feature Flags
  features: {
    enableMocks: true, // Enable mock services for development
    enableDebugTools: true, // Enable Angular debug tools
    enablePerformanceMonitoring: true, // Enable performance tracking
    enableErrorReporting: true // Enable detailed error reporting
  },

  // Security Configuration
  security: {
    enableCORS: true, // Enable CORS for development
    allowedOrigins: [
      'https://vroozi-backend-pz5d.onrender.com',
      'http://localhost:4200' // Angular development server
    ],
    enableCSP: true, // Enable Content Security Policy
    enableXSRF: true, // Enable XSRF protection
    maxSessionDuration: 28_800, // 8 hours in seconds
    tokenEncryptionKey: 'development-encryption-key' // Added encryption key for JWT tokens
  },

  // Company Information
  companyName: 'VROOZI',
  companyLogo: 'assets/images/company-logo.png',
  companyAddress: '123 Business Street, Los Angeles, CA 90001',
  companyPhone: '(555) 123-4567',
  companyEmail: 'support@vroozi.com',
};