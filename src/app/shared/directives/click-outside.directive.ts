// @angular/core v15.0.0
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output
} from '@angular/core';

/**
 * Directive that detects clicks outside of an element and emits an event.
 * Provides robust click detection with proper type safety and memory management.
 * Used for closing dropdowns, modals, and menus when clicking outside.
 *
 * @example
 * <div (clickOutside)="onClickOutside()">Content</div>
 */
@Directive({
  selector: '[clickOutside]'
})
export class ClickOutsideDirective implements OnDestroy {
  /**
   * Event emitted when a click is detected outside the host element
   */
  @Output() clickOutside = new EventEmitter<void>();

  /**
   * Reference to the host element for click detection comparison
   */
  private readonly elementRef: ElementRef;

  constructor(elementRef: ElementRef) {
    this.elementRef = elementRef;
  }

  /**
   * Handles document click events with proper type checking and null safety.
   * Determines if the click occurred outside the host element and emits event accordingly.
   * 
   * @param event - The DOM click event
   */
  @HostListener('document:click', ['$event'])
  onClick(event: Event): void {
    try {
      // Ensure we have a valid event target
      if (!event?.target) {
        return;
      }

      // Type cast with safety check
      const targetElement = event.target as Element;
      
      // Check if click target is a valid Element
      if (!(targetElement instanceof Element)) {
        return;
      }

      // Get the host element from the ElementRef
      const hostElement = this.elementRef.nativeElement;

      // Verify we have a valid host element
      if (!hostElement || !(hostElement instanceof Element)) {
        return;
      }

      // Check if the click was outside the host element
      if (!hostElement.contains(targetElement)) {
        this.clickOutside.emit();
      }
    } catch (error) {
      // Log error but don't crash the application
      console.error('Error in ClickOutsideDirective:', error);
    }
  }

  /**
   * Cleanup method to prevent memory leaks.
   * Implements OnDestroy for proper cleanup when directive is destroyed.
   */
  ngOnDestroy(): void {
    // Clean up the EventEmitter
    if (this.clickOutside) {
      this.clickOutside.complete();
    }
  }
}