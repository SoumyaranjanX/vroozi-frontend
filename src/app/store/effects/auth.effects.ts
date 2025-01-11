/**
 * @fileoverview Authentication effects implementation for NgRx state management
 * Implements secure authentication flow with comprehensive error handling and token management
 * @version 1.0.0
 * @package @ngrx/effects@15.0.0
 */

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { IAppState } from '../state/app.state';
import { Store } from '@ngrx/store';
import { IRegistrationResponse } from '@app/shared/models/user.model';

@Injectable()
export class AuthEffects {
    private readonly actions$ = inject(Actions);
    private readonly store = inject(Store<IAppState>);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly notificationService = inject(NotificationService);

  // Registration effect
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      tap(action => console.log('Register effect triggered with:', action)),
      mergeMap(({ first_name, last_name, email, password }) =>
        this.authService.register({ first_name, last_name, email, password }).pipe(
          tap((response: IRegistrationResponse) => console.log('Registration API response:', response)),
          map((response: IRegistrationResponse) => AuthActions.registerSuccess({
            message: response.message,
            timestamp: Date.now()
          })),
          catchError(error => {
            console.error('Registration API error:', error);
            return of(AuthActions.registerFailure({ 
              error: error.error?.detail || 'Registration failed. Please try again.' 
            }));
          })
        )
      )
    )
  );

  // Navigate after successful registration
  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap((action) => {
        // Show success notification
        this.notificationService.showSuccess(action.message);
        // Navigate to login page after successful registration
        this.router.navigate(['/auth/login']);
      })
    ),
    { dispatch: false }
  );

  // Login effect
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      tap(action => console.log('Login effect triggered with:', action)),
      mergeMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          tap(response => console.log('Login API response:', response)),
          map(response => AuthActions.loginSuccess({
            ...response,
            timestamp: Date.now()
          })),
          catchError(error => {
            console.error('Login API error:', error);
            return of(AuthActions.loginFailure({ 
              error: error.error?.message || 'Login failed. Please try again.' 
            }));
          })
        )
      )
    )
  );

  // Navigate after successful login
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        // Navigate to dashboard after successful login
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  // Logout effect
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      mergeMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess()))
        )
      )
    )
  );

  // Navigate after logout
  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        // Navigate to login page after logout
        this.router.navigate(['/auth/login']);
      })
    ),
    { dispatch: false }
  );
}