/**
 * @fileoverview Purchase Orders feature module implementing template-based PO generation,
 * Material Design integration, and role-based access control.
 * @version 1.0.0
 * @license MIT
 */

// Angular Core - v15.0.0
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { PurchaseOrdersRoutingModule } from './purchase-orders-routing.module';
import { POListComponent } from './components/po-list/po-list.component';
import { POGenerationComponent } from './components/po-generation/po-generation.component';
import { POTemplateViewComponent } from './components/po-template-view/po-template-view.component';

@NgModule({
  declarations: [
    POListComponent,
    POTemplateViewComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PurchaseOrdersRoutingModule,
    POGenerationComponent
  ],
  exports: [
    POTemplateViewComponent
  ]
})
export class PurchaseOrdersModule { }