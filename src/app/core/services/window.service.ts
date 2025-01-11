import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Time in milliseconds to debounce window resize events
 * @constant {number}
 */
const RESIZE_DEBOUNCE_TIME = 150;

/**
 * Interface defining window dimensions
 */
interface WindowDimensions {
  width: number;
  height: number;
}

/**
 * Service providing type-safe access to window object and related functionality.
 * Implements reactive window dimension tracking and smooth scrolling with cross-browser support.
 * 
 * @remarks
 * Supports all major browsers:
 * - Chrome 90+
 * - Firefox 85+
 * - Safari 14+
 * - Edge 90+
 * - Mobile Chrome 90+
 * - Mobile Safari 14+
 */
@Injectable({
  providedIn: 'root'
})
export class WindowService implements OnDestroy {
  /**
   * Subject tracking current window dimensions
   * @private
   */
  private dimensionsSubject: BehaviorSubject<WindowDimensions>;

  /**
   * Observable stream of window dimensions
   * @public
   */
  public dimensions$: Observable<WindowDimensions>;

  /**
   * Subscription for resize event listener
   * @private
   */
  private resizeSubscription: Subscription | null = null;

  constructor() {
    // Initialize with current window dimensions
    this.dimensionsSubject = new BehaviorSubject<WindowDimensions>(
      this.getWindowDimensions()
    );
    this.dimensions$ = this.dimensionsSubject.asObservable();

    // Set up resize event listener with performance optimizations
    const window = this.getWindow();
    if (window) {
      this.resizeSubscription = fromEvent(window, 'resize')
        .pipe(
          debounceTime(RESIZE_DEBOUNCE_TIME),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.dimensionsSubject.next(this.getWindowDimensions());
        });
    }
  }

  /**
   * Returns the native window object in a type-safe manner
   * @returns {Window | undefined} Window object or undefined in non-browser environments
   */
  public getWindow(): Window | undefined {
    return typeof window !== 'undefined' ? window : undefined;
  }

  /**
   * Gets current window dimensions with type safety and error handling
   * @returns {WindowDimensions} Current window dimensions or default values
   */
  public getWindowDimensions(): WindowDimensions {
    const window = this.getWindow();
    if (window) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return { width: 0, height: 0 };
  }

  /**
   * Scrolls window to top position with optional smooth behavior
   * @param {boolean} smooth - Whether to use smooth scrolling behavior
   */
  public scrollToTop(smooth: boolean = true): void {
    const window = this.getWindow();
    if (!window) {
      return;
    }

    try {
      if (smooth && 'scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  public ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}