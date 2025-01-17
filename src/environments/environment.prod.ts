import { Environment } from './environment.interface';

export const environment: Environment = {
  production: true,
  version: '2.0.0',
  apiUrl: 'https://vroozi-backend-pz5d.onrender.com/api/v1',
  googleVisionApiUrl: 'https://vision.googleapis.com/v1',
  s3BucketUrl: 'https://pub-dc2feb6aa8314296ab626daad5932a49.r2.dev',
  cdnUrl: 'https://cdn.vroozi.com',

  apiRateLimit: {
    requestsPerMinute: 200,
    burstAllowance: 10,
    perUserLimit: 100,
    perOrgLimit: 2000
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
    level: 'error',
    enableConsole: false,
    enableFileLogging: true,
    logFilePath: './logs/app.log',
    maxLogFileSize: 10_485_760
  },

  features: {
    enableMocks: false,
    enableDebugTools: false,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true
  },

  security: {
    enableCORS: true,
    allowedOrigins: [
      'https://vroozi-backend-pz5d.onrender.com',
      'https://app.vroozi.com'
    ],
    enableCSP: true,
    enableXSRF: true,
    maxSessionDuration: 28_800,
    tokenEncryptionKey: 'production-encryption-key'
  },

  // Company Information
  companyName: 'Contract Processing',
  companyLogo: 'assets/images/company-logo.png',
  companyAddress: '123 Business Street, Los Angeles, CA 90001',
  companyPhone: '(555) 123-4567',
  companyEmail: 'support@vroozi.com'
};