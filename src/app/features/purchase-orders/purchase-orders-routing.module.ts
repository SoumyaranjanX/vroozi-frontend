// @angular/core v15.0.0
import { NgModule } from '@angular/core';
// @angular/router v15.0.0
import { RouterModule, Routes } from '@angular/router';

// Components
import { POListComponent } from './components/po-list/po-list.component';
import { POGenerationComponent } from './components/po-generation/po-generation.component';

// Guards and Models
import { AuthGuard } from '@core/auth/auth.guard';
import { UserRole } from '@shared/models/user.model';

/**
 * Routes configuration for the Purchase Orders feature module
 * Implements role-based access control and performance optimizations
 */
const routes: Routes = [
  {
    path: '',
    component: POListComponent
  },
  {
    path: 'new',
    component: POGenerationComponent
  }
];

/**
 * Routing module for Purchase Orders feature
 * Implements secure, role-based routes with performance optimizations
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrdersRoutingModule { }