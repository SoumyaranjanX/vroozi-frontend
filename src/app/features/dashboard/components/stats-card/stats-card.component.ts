// @angular/core v15.0.0
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
// @angular/material/card v15.0.0
import { MatCardModule } from '@angular/material/card';
// @angular/material/icon v15.0.0
import { MatIconModule } from '@angular/material/icon';
// @angular/common v15.0.0
import { CommonModule } from '@angular/common';

/**
 * A reusable component that displays statistics in a Material card format.
 * Used in the dashboard to show key metrics like active contracts, processing queue, etc.
 * Implements responsive design and accessibility features.
 */
@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
})
export class StatsCardComponent {
  /**
   * The title of the statistics card
   */
  @Input() title!: string;

  /**
   * The numeric value to display
   */
  @Input() count!: number;

  /**
   * Material icon name to display
   * @default 'assessment'
   */
  @Input() icon: string = 'assessment';

  /**
   * Custom color for the card accent
   * @default '#ebb502' (Gold from design system)
   */
  @Input() color: string = '#ebb502';

  /**
   * Loading state for the card
   */
  @Input() loading: boolean = false;

  /**
   * Error state for the card
   */
  @Input() error: string | null = null;

  /**
   * Default color from design system
   */
  private readonly defaultColor: string = '#ebb502';

  /**
   * Default icon for the card
   */
  private readonly defaultIcon: string = 'assessment';

  /**
   * Generates styles for the card including color customization
   * @returns Object containing style properties
   */
  getCardStyles(): { [key: string]: string } {
    return {
      'border-left': `4px solid ${this.color || this.defaultColor}`,
      'color': this.color || this.defaultColor
    };
  }

  /**
   * Returns the icon name with fallback to default
   * @returns Material icon name
   */
  getIconName(): string {
    return this.icon || this.defaultIcon;
  }

  /**
   * Formats the count value for display
   * Handles large numbers with appropriate formatting
   * @returns Formatted string representation of the count
   */
  getFormattedCount(): string {
    if (this.loading) {
      return '...';
    }

    if (this.error) {
      return '-';
    }

    if (typeof this.count !== 'number') {
      return '0';
    }

    if (this.count >= 1000000) {
      return `${(this.count / 1000000).toFixed(1)}M`;
    }

    if (this.count >= 1000) {
      return `${(this.count / 1000).toFixed(1)}K`;
    }

    return this.count.toString();
  }

  /**
   * Gets the appropriate ARIA label for the card
   * @returns Accessibility label for the card
   */
  getAriaLabel(): string {
    if (this.loading) {
      return `${this.title} statistics: Loading...`;
    }

    if (this.error) {
      return `${this.title} statistics: Error loading data`;
    }

    return `${this.title} statistics: ${this.getFormattedCount()}`;
  }
}