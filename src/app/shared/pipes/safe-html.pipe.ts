// @angular/core v15.0.0
import { Pipe, PipeTransform } from '@angular/core';
// @angular/platform-browser v15.0.0
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * A pure Angular pipe that safely transforms HTML strings into sanitized SafeHtml objects.
 * This pipe prevents XSS (Cross-Site Scripting) attacks while allowing trusted HTML content
 * to be rendered in templates.
 * 
 * Usage in templates:
 * <div [innerHTML]="htmlContent | safeHtml"></div>
 * 
 * @example
 * // In component
 * htmlContent = '<p>Some <strong>HTML</strong> content</p>';
 * 
 * // In template
 * <div [innerHTML]="htmlContent | safeHtml"></div>
 * 
 * @security This pipe uses Angular's DomSanitizer to prevent XSS attacks.
 * Only use this pipe with trusted HTML content from verified sources.
 */
@Pipe({
  name: 'safeHtml',
  pure: true // Marking as pure for better performance as transform is deterministic
})
export class SafeHtmlPipe implements PipeTransform {
  /**
   * Creates an instance of SafeHtmlPipe.
   * @param sanitizer - Angular's DomSanitizer service for HTML sanitization
   */
  constructor(private readonly sanitizer: DomSanitizer) {}

  /**
   * Transforms an HTML string into a sanitized SafeHtml object that can be safely
   * rendered in templates.
   * 
   * @param html - The HTML string to be sanitized and transformed
   * @returns A sanitized version of the input HTML that can be safely rendered
   * @throws Error if the input is null or undefined
   * 
   * @example
   * transform('<p>Hello <strong>World</strong></p>')
   * // Returns SafeHtml object with sanitized content
   */
  transform(html: string): SafeHtml {
    if (html == null) {
      throw new Error('SafeHtmlPipe: Input HTML cannot be null or undefined');
    }

    try {
      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('SafeHtmlPipe: Error sanitizing HTML content', error);
      // Return empty sanitized HTML in case of error to prevent rendering failures
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
  }
}