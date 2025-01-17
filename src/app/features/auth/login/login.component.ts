// Angular core imports - v15.0.0
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { IAuthState } from '../../../store/state/auth.state';
import * as AuthActions from '../../../store/actions/auth.actions';
import { selectAuthError, selectAuthState } from '../../../store/reducers/auth.reducer';
import { environment } from '../../../../environments/environment';
import { LoadingService } from '@app/core/services/loading.service';

/**
 * LoginComponent implements a secure login interface with comprehensive validation,
 * error handling, and state management for user authentication.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  // Form group for login form
  loginForm: FormGroup;

  // Loading and error state management
  isLoading = false;
  error: string | null = null;
  fieldErrors = new Map<string, string>();

  // Observable states
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  // Password visibility state
  showPassword = false;

  // Security-related properties
  loginAttempts = 0;
  readonly MAX_LOGIN_ATTEMPTS = 5;
  isLocked = false;
  readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  // RxJS cleanup
  private readonly destroy$ = new Subject<void>();

  // Password validation pattern following security requirements
  private readonly PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  /**
   * Current year for the copyright notice
   */
  public currentYear = new Date().getFullYear();

  /**
   * Application version from environment
   */
  public appVersion = environment.version;

  private authStateSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private store: Store<{ auth: IAuthState }>,
    private router: Router,
    private loadingService: LoadingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });

    // this.loading$ = this.store.select(state => state.auth.loading);
    this.loading$ = this.loadingService.getLoadingState();
    this.error$ = this.store.select(selectAuthError);
  }

  ngOnInit() {
    this.loadingService.hide();
    this.store
      .select(selectAuthState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.error) {
          this.showError(authState.error);
          this.loadingService.hide();
        }
        if (authState.user) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ email, password, rememberMe }));
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private showError(error: string) {
    console.error('Login error:', error);
    this.loadingService.hide();
  }

  ngOnDestroy() {
    this.loadingService.hide();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
