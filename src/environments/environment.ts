import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  version: '2.0.0',
  apiUrl: 'https://vroozi-backend-pz5d.onrender.com/api/v1',
  googleVisionApiUrl: 'https://vision.googleapis.com/v1',
  s3BucketUrl: 'http://localhost:9000',
  cdnUrl: 'https://cdn.vroozi.com',

  apiRateLimit: {
    requestsPerMinute: 100,
    burstAllowance: 20,
    perUserLimit: 50,
    perOrgLimit: 1000
  },

  tokenConfig: {
    accessTokenExpiry: 3600,
    refreshTokenExpiry: 604800,
    tokenType: 'Bearer',
    issuer: 'contract-processing-system'
  },

  fileConfig: {
    maxSingleFileSize: 25_000_000,
    maxBulkUploadSize: 500_000_000,
    supportedFileTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFilesPerBatch: 50
  },

  logging: {
    level: 'debug',
    enableConsole: true,
    enableFileLogging: true,
    logFilePath: './logs/app.log',
    maxLogFileSize: 10_485_760
  },

  features: {
    enableMocks: true,
    enableDebugTools: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true
  },

  security: {
    enableCORS: true,
    allowedOrigins: [
      'https://vroozi-backend-pz5d.onrender.com',
      'http://localhost:4200'
    ],
    enableCSP: true,
    enableXSRF: true,
    maxSessionDuration: 28_800,
    tokenEncryptionKey: 'development-encryption-key'
  },

  // Company Information
  companyName: 'VROOZI',
  companyLogo: 'assets/images/company-logo.png',
  companyAddress: '123 Business Street, Los Angeles, CA 90001',
  companyPhone: '(555) 123-4567',
  companyEmail: 'support@vroozi.com'
};