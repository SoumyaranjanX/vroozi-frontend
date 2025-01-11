import { Pipe, PipeTransform } from '@angular/core'; // @angular/core v15.0.0

/**
 * A pure pipe that efficiently truncates text to a specified length with configurable options.
 * Supports both character-based and word-based truncation with customizable ellipsis.
 * 
 * @example
 * // Basic usage
 * {{ longText | truncate:20 }}
 * 
 * // With complete words
 * {{ longText | truncate:20:true }}
 * 
 * // With custom ellipsis
 * {{ longText | truncate:20:true:'…' }}
 */
@Pipe({
  name: 'truncate',
  pure: true // Optimize performance by making the pipe pure
})
export class TruncatePipe implements PipeTransform {
  /**
   * Transforms input text by truncating it to the specified length.
   * 
   * @param value - The input text to truncate
   * @param limit - Maximum length of the truncated text (default: 20)
   * @param completeWords - Whether to maintain complete words (default: false)
   * @param ellipsis - Custom ellipsis string (default: '...')
   * @returns Truncated text with ellipsis if truncation occurred, otherwise original text
   */
  transform(
    value: any,
    limit: number = 20,
    completeWords: boolean = false,
    ellipsis: string = '...'
  ): string {
    // Handle null/undefined input
    if (value == null) {
      return '';
    }

    // Convert input to string and handle non-string inputs
    const text = String(value);

    // Return original text if no truncation needed
    if (text.length <= limit) {
      return text;
    }

    // Sanitize input limit to be a positive number
    const sanitizedLimit = Math.abs(Math.floor(limit));

    // Handle RTL text direction
    const isRTL = this.isRTLText(text);
    if (isRTL) {
      return this.truncateRTL(text, sanitizedLimit, completeWords, ellipsis);
    }

    // Calculate truncation position
    let truncateAt = sanitizedLimit;

    if (completeWords) {
      // Find the last space before the limit
      const lastSpace = text.substring(0, sanitizedLimit).lastIndexOf(' ');
      truncateAt = lastSpace > 0 ? lastSpace : sanitizedLimit;
    }

    // Handle multi-byte characters by checking if we're in the middle of a surrogate pair
    const charCode = text.charCodeAt(truncateAt - 1);
    if (this.isHighSurrogate(charCode)) {
      truncateAt--;
    }

    // Return truncated text with ellipsis
    return text.substring(0, truncateAt) + ellipsis;
  }

  /**
   * Checks if the given text is RTL (Right-to-Left).
   * 
   * @param text - Text to check for RTL direction
   * @returns True if text contains RTL characters
   */
  private isRTLText(text: string): boolean {
    const RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return RTL_REGEX.test(text);
  }

  /**
   * Checks if the given character code is a high surrogate.
   * 
   * @param charCode - Character code to check
   * @returns True if character code is a high surrogate
   */
  private isHighSurrogate(charCode: number): boolean {
    return charCode >= 0xD800 && charCode <= 0xDBFF;
  }

  /**
   * Handles truncation for RTL text.
   * 
   * @param text - RTL text to truncate
   * @param limit - Maximum length
   * @param completeWords - Whether to maintain complete words
   * @param ellipsis - Ellipsis string
   * @returns Truncated RTL text
   */
  private truncateRTL(
    text: string,
    limit: number,
    completeWords: boolean,
    ellipsis: string
  ): string {
    // For RTL text, we truncate from the start and add ellipsis at the beginning
    const startPos = text.length - limit;
    let truncated = text.substring(startPos);

    if (completeWords) {
      // Find the first space after the start position
      const firstSpace = truncated.indexOf(' ');
      if (firstSpace > 0) {
        truncated = truncated.substring(firstSpace + 1);
      }
    }

    return ellipsis + truncated;
  }
}