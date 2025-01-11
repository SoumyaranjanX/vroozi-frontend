// @angular/core v15.0.0
import { Injectable } from '@angular/core';
// rxjs v7.8.0
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service responsible for managing global loading state in the application.
 * Provides methods to show/hide loading indicators and observe loading state changes.
 * 
 * Used to provide visual feedback during asynchronous operations like API calls,
 * file processing, etc.
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  /**
   * BehaviorSubject that holds the current loading state.
   * Initialized as false since no loading should be shown by default.
   * @private
   */
  private loading$ = new BehaviorSubject<boolean>(false);

  /**
   * Initializes the LoadingService with default state (not loading).
   */
  constructor() {}

  /**
   * Shows the loading indicator by emitting true to the loading$ subject.
   * Should be called at the start of async operations.
   */
  public show(): void {
    this.loading$.next(true);
  }

  /**
   * Hides the loading indicator by emitting false to the loading$ subject.
   * Should be called when async operations complete (both success and error cases).
   */
  public hide(): void {
    this.loading$.next(false);
  }

  /**
   * Returns the loading state as an Observable<boolean>.
   * Components can subscribe to this to reactively update their UI
   * based on loading state changes.
   * 
   * @returns Observable<boolean> that emits the current loading state
   * 
   * @example
   * ```typescript
   * // In a component:
   * this.loading$ = this.loadingService.getLoadingState();
   * 
   * // In the template:
   * <loading-spinner *ngIf="loading$ | async"></loading-spinner>
   * ```
   */
  public getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }
}