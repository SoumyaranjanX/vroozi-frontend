// @angular/core/testing v15.0.0
import { getTestBed, TestBed } from '@angular/core/testing';

// @angular/platform-browser-dynamic/testing v15.0.0
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// zone.js/testing v0.13.0
import 'zone.js/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

declare const __karma__: any;

/**
 * Initialize the Angular testing environment.
 * This function sets up the necessary testing modules and platform
 * for running Angular unit tests with Jest and Karma integration.
 */
const initTestEnvironment = (): void => {
  // Prevent re-initialization of test environment
  try {
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  } catch (e) {
    console.warn(
      'Test environment has already been initialized. Skipping re-initialization.'
    );
  }
};

// Initialize the test environment
initTestEnvironment();

// Configure test coverage reporting
if (__karma__) {
  __karma__.config.set({
    coverageReporter: {
      dir: './coverage/web',
      reporters: [
        { type: 'html' },
        { type: 'lcov' },
        { type: 'text-summary' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    }
  });
}

// Create test context for test file discovery
const context = require.context('./', true, /\.spec\.ts$/);

// Load all test files
context.keys().forEach(context);