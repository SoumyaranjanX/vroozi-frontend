import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ]
})
export class LoadingComponent {
  @Input() loadingMessage: string = 'Loading...';
  @Input() diameter: number = 40;
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() value: number = 0;
  @Input() isLoading: boolean = false;

  /**
   * Shows or hides the loading indicator
   * @param value Whether to show the loading indicator
   */
  show(value: boolean = true): void {
    this.isLoading = value;
  }

  /**
   * Hides the loading indicator
   */
  hide(): void {
    this.isLoading = false;
  }
}