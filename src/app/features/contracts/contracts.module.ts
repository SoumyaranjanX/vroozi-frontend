// Angular Core - v15.0.0
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';

// Internal Imports
import { ContractsRoutingModule } from './contracts-routing.module';
import { ContractListComponent } from './components/contract-list/contract-list.component';
import { ContractUploadComponent } from './components/contract-upload/contract-upload.component';
import { ContractViewComponent } from './components/contract-view/contract-view.component';
import { ContractService } from './services/contract.service';
import { SharedModule } from '../../shared/shared.module';

/**
 * Feature module that bundles all contract-related functionality with comprehensive
 * error handling, accessibility support, and internationalization capabilities.
 * Implements lazy loading for optimized performance.
 */
@NgModule({
  imports: [
    // Angular Core
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    
    // Feature Routing
    ContractsRoutingModule,
    
    // Material Design Components
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    ScrollingModule,

    // Shared Module (includes common components, directives, and pipes)
    SharedModule,

    // Standalone Components
    ContractUploadComponent,
    ContractViewComponent
  ],
  declarations: [
    // Components
    ContractListComponent
  ],
  providers: [
    ContractService
  ]
})
export class ContractsModule {
  /**
   * Static identifier for lazy loading configuration
   */
  static readonly moduleName = 'contracts';

  constructor() {
    // Initialize module-level error handling and accessibility features
    this.initializeErrorHandling();
    this.initializeAccessibility();
  }

  /**
   * Sets up module-level error handling configuration
   * @private
   */
  private initializeErrorHandling(): void {
    // Configure error boundaries and logging for contract operations
    window.addEventListener('error', (event: ErrorEvent) => {
      if (event.filename?.includes('contracts')) {
        console.error('Contract Module Error:', event.error);
        // Additional error handling logic can be added here
      }
    });
  }

  /**
   * Initializes accessibility features for the contracts module
   * @private
   */
  private initializeAccessibility(): void {
    // Set up ARIA landmarks and keyboard navigation handlers
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Handle escape key for modal dialogs and overlays
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.closest('[role="dialog"]')) {
          activeElement.blur();
        }
      }
    });
  }
}