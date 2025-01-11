// Angular core imports - v15.0.0
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// NgRx imports - v15.0.0
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

// Internal imports
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AuthEffects } from '../../store/effects/auth.effects';
import { reducer as authReducer } from '../../store/reducers/auth.reducer';

/**
 * Routes configuration for the authentication feature module
 * Implements secure routing with guards and lazy loading
 */
const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { 
      title: 'Login'
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: {
      title: 'Create Account'
    }
  },
  {
    path: 'logout',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];

/**
 * AuthModule provides authentication functionality including:
 * - Secure login with comprehensive validation
 * - User registration with form validation
 * - State management for authentication
 * - Token-based authentication with JWT
 * - Integration with corporate security standards
 */
@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(authRoutes),
    
    // Material Modules
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,

    // Translation
    TranslateModule,

    // Standalone Components
    AlertComponent,
    LoadingComponent,

    // NgRx Configuration
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects])
  ]
})
export class AuthModule { }