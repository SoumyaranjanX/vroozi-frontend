// @ts-check
// Karma configuration file for enterprise Angular testing
// Version: 2.0.0
// External dependencies versions:
// @types/karma: ^6.3.0
// @types/jasmine: ~4.3.0
// karma-coverage: ^2.2.0
// karma-junit-reporter: ^2.0.1
// karma-parallel: ^0.3.1

import { Config, ConfigOptions } from 'karma';

/**
 * Enhanced Karma configuration function that sets up an enterprise-grade
 * test environment with comprehensive coverage reporting, multi-browser support,
 * and security measures.
 * 
 * @param config - Karma configuration object
 */
export default function(config: Config): void {
  const baseConfig: ConfigOptions = {
    // Base path used to resolve all patterns
    basePath: '',

    // Frameworks to use
    frameworks: ['jasmine', 'parallel'],

    // List of files/patterns to load in the browser
    files: [
      { pattern: './src/test.ts', type: 'module' },
      { pattern: './src/**/*.spec.ts', type: 'module' }
    ],

    // Preprocess matching files before serving them
    preprocessors: {
      './src/test.ts': ['coverage'],
      './src/**/*.spec.ts': ['coverage']
    },

    // Plugin configurations
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-safari-launcher'),
      require('karma-edge-launcher'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
      require('karma-parallel')
    ],

    // Test results reporter configuration
    reporters: ['progress', 'coverage', 'junit'],

    // Coverage reporter configuration
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'html', dir: './coverage/html' },
        { type: 'lcov', dir: './coverage/lcov' },
        { type: 'text-summary' },
        { type: 'junit', dir: './coverage/junit' }
      ],
      // Coverage thresholds
      check: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      },
      // Enterprise reporting integration
      enterpriseReporter: {
        enabled: true,
        endpoint: '/api/coverage',
        format: 'json',
        auth: {
          type: 'bearer',
          token: process.env.ENTERPRISE_REPORTER_TOKEN
        }
      }
    },

    // JUnit reporter configuration
    junitReporter: {
      outputDir: './test-results/junit',
      outputFile: 'test-results.xml',
      useBrowserName: true,
      nameFormatter: undefined,
      classNameFormatter: undefined,
      properties: {},
      xmlVersion: null
    },

    // Browser launcher configuration
    browsers: ['ChromeHeadless', 'FirefoxHeadless', 'SafariHeadless', 'EdgeHeadless'],
    
    // Browser configuration
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--remote-debugging-port=9222'
        ]
      },
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['--headless']
      },
      SafariHeadless: {
        base: 'Safari',
        flags: ['--headless']
      },
      EdgeHeadless: {
        base: 'Edge',
        flags: ['--headless']
      }
    },

    // Parallel execution configuration
    parallelOptions: {
      executors: 4,
      shardStrategy: 'round-robin',
      baseTimeout: 10000
    },

    // Performance optimization
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,

    // Memory management
    memoryConfiguration: {
      maxHeapSize: '2048m',
      gcInterval: 100
    },

    // Security settings
    security: {
      envEncryption: true,
      reportAccess: 'restricted',
      browserIsolation: true,
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'"],
        'connect-src': ["'self'"]
      }
    },

    // Logging configuration
    logLevel: config.LOG_INFO,
    colors: true,
    autoWatch: true,
    singleRun: false,
    restartOnFileChange: true,

    // TypeScript configuration
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.spec.json',
      compilerOptions: {
        module: 'commonjs',
        sourceMap: true
      },
      bundlerOptions: {
        transforms: [require('karma-typescript-es6-transform')()]
      }
    }
  };

  // Apply configuration
  config.set(baseConfig);
}