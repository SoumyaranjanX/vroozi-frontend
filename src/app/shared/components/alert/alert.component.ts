import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class AlertComponent {
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() message: string = '';
  @Input() title?: string;
  @Input() dismissible: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  show = true;

  get alertType(): string {
    return this.type;
  }

  get alertClass(): string {
    return `alert-${this.type}`;
  }

  get iconClass(): string {
    return `alert-icon-${this.type}`;
  }

  get icon(): string {
    switch (this.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  close(): void {
    this.show = false;
    this.dismissed.emit();
  }
}