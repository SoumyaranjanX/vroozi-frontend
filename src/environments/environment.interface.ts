export interface Environment {
  production: boolean;
  version: string;
  apiUrl: string;
  googleVisionApiUrl: string;
  s3BucketUrl: string;
  cdnUrl: string;

  apiRateLimit: {
    requestsPerMinute: number;
    burstAllowance: number;
    perUserLimit: number;
    perOrgLimit: number;
  };

  tokenConfig: {
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    tokenType: string;
    issuer: string;
  };

  fileConfig: {
    maxSingleFileSize: number;
    maxBulkUploadSize: number;
    supportedFileTypes: string[];
    maxFilesPerBatch: number;
  };

  logging: {
    level: string;
    enableConsole: boolean;
    enableFileLogging: boolean;
    logFilePath: string;
    maxLogFileSize: number;
  };

  features: {
    enableMocks: boolean;
    enableDebugTools: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
  };

  security: {
    enableCORS: boolean;
    allowedOrigins: string[];
    enableCSP: boolean;
    enableXSRF: boolean;
    maxSessionDuration: number;
    tokenEncryptionKey: string;
  };

  // Company Information
  companyName: string;
  companyLogo: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
}