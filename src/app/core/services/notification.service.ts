// @angular/core v15.0.0
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertType } from '../../shared/models/alert.model';

/**
 * Service that provides centralized notification management for the application
 * with support for different notification types, auto-dismissal, and accessibility.
 * Implements corporate styling guidelines and consistent behavior across the app.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showNotification(message: string, type: AlertType = AlertType.INFO, duration: number = 3000): void {
    const panelClass = `notification-${type.toLowerCase()}`;
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  showSuccess(message: string, duration?: number): void {
    this.showNotification(message, AlertType.SUCCESS, duration);
  }

  showError(message: string, duration?: number): void {
    this.showNotification(message, AlertType.ERROR, duration);
  }

  showWarning(message: string, duration?: number): void {
    this.showNotification(message, AlertType.WARNING, duration);
  }

  showInfo(message: string, duration?: number): void {
    this.showNotification(message, AlertType.INFO, duration);
  }
}