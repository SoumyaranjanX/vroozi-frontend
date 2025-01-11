/**
 * Polyfills for Angular Application
 * Provides comprehensive browser compatibility features
 * 
 * Browser Support:
 * - Chrome 90+
 * - Firefox 85+
 * - Safari 14+
 * - Edge 90+
 * - Mobile Chrome 90+
 * - Mobile Safari 14+
 * 
 * @version Angular 15.0.0
 */

/***************************************************************************************************
 * Zone JS is required by default for Angular itself
 * @version 0.13.0
 */
import 'zone.js';  // Included with Angular CLI

/**
 * Feature detection constants for conditional polyfill loading
 */
const BROWSER_SUPPORTS_WEB_ANIMATIONS = typeof Element !== 'undefined' && 'animate' in Element.prototype;
const CUSTOM_ELEMENTS_SUPPORTED = 'customElements' in window;
const CLASS_LIST_SUPPORTED = 'classList' in Element.prototype;

/**
 * Performance monitoring metrics
 */
const PERFORMANCE_MARKS = {
    POLYFILLS_START: 'polyfills-start',
    POLYFILLS_END: 'polyfills-end'
};

/**
 * Loads a polyfill script dynamically based on condition
 * @param polyfillUrl - URL of the polyfill script
 * @param condition - Boolean condition determining if polyfill is needed
 * @returns Promise that resolves when polyfill is loaded or not needed
 */
async function loadPolyfill(polyfillUrl: string, condition: boolean): Promise<void> {
    if (!condition) {
        try {
            performance.mark(`${polyfillUrl}-start`);
            await import(polyfillUrl);
            performance.mark(`${polyfillUrl}-end`);
            performance.measure(
                `${polyfillUrl}-load-time`,
                `${polyfillUrl}-start`,
                `${polyfillUrl}-end`
            );
        } catch (error: unknown) {
            console.error(`Failed to load polyfill: ${polyfillUrl}`, error);
            // Log error to monitoring service if available
            if (typeof window.errorLogger !== 'undefined') {
                window.errorLogger.logError('Polyfill Loading Error', {
                    polyfill: polyfillUrl,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
}

/**
 * Initializes all required polyfills in the correct order
 * @returns Promise that resolves when all polyfills are initialized
 */
async function initializePolyfills(): Promise<void> {
    performance.mark(PERFORMANCE_MARKS.POLYFILLS_START);

    try {
        // Load Web Animations API polyfill if needed
        // @version 15.0.0
        if (!BROWSER_SUPPORTS_WEB_ANIMATIONS) {
            await loadPolyfill('@angular/platform-browser/animations/web-animations-js', 
                             !BROWSER_SUPPORTS_WEB_ANIMATIONS);
        }

        // Load Custom Elements polyfill if needed
        // @version 1.5.0
        if (!CUSTOM_ELEMENTS_SUPPORTED) {
            await loadPolyfill('@webcomponents/custom-elements', 
                             !CUSTOM_ELEMENTS_SUPPORTED);
        }

        // Load classList polyfill for older browsers if needed
        if (!CLASS_LIST_SUPPORTED) {
            await loadPolyfill('classlist-polyfill', 
                             !CLASS_LIST_SUPPORTED);
        }

        performance.mark(PERFORMANCE_MARKS.POLYFILLS_END);
        performance.measure(
            'polyfills-total-time',
            PERFORMANCE_MARKS.POLYFILLS_START,
            PERFORMANCE_MARKS.POLYFILLS_END
        );

    } catch (error: unknown) {
        console.error('Error initializing polyfills:', error);
        // Implement graceful degradation strategy
        handlePolyfillError(error instanceof Error ? error : new Error(String(error)));
    }
}

/**
 * Handles polyfill loading errors with graceful degradation
 * @param error - The error that occurred during polyfill loading
 */
function handlePolyfillError(error: Error): void {
    // Log error to console and monitoring service
    console.error('Polyfill initialization error:', error);

    // Notify user if critical polyfills failed to load
    if (typeof window.notifyUser !== 'undefined') {
        window.notifyUser({
            type: 'warning',
            message: 'Some features may not be available in your browser.',
            details: error.message
        });
    }

    // Track error metrics
    if (typeof window.errorMetrics !== 'undefined') {
        window.errorMetrics.trackError('PolyfillLoadError', {
            errorType: error.name,
            errorMessage: error.message,
            browserInfo: navigator.userAgent
        });
    }
}

// Initialize polyfills
initializePolyfills().catch(handlePolyfillError);

// Declare global interfaces for TypeScript
declare global {
    interface Window {
        errorLogger?: {
            logError(type: string, details: object): void;
        };
        notifyUser?: (options: {
            type: string;
            message: string;
            details?: string;
        }) => void;
        errorMetrics?: {
            trackError(type: string, details: object): void;
        };
    }
}

export { initializePolyfills, loadPolyfill };