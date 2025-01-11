import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { IAuthState } from '../../../store/state/auth.state';
import * as AuthActions from '../../../store/actions/auth.actions';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  success$: Observable<boolean>;

  // Password validation pattern
  private readonly PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // RxJS cleanup
  private readonly destroy$ = new Subject<void>();

  // Footer data
  public currentYear = new Date().getFullYear();
  public appVersion = environment.version;

  constructor(
    private formBuilder: FormBuilder,
    private store: Store<{ auth: IAuthState }>,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [
        Validators.required,
        Validators.maxLength(128),
        Validators.pattern(this.PASSWORD_PATTERN)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    // Initialize store selectors
    this.loading$ = this.store.select(state => state.auth.registration?.loading ?? false);
    this.error$ = this.store.select(state => state.auth.registration?.error ?? null);
    this.success$ = this.store.select(state => state.auth.registration?.success ?? false);
  }

  ngOnInit(): void {
    // Subscribe to form changes for validation
    this.registerForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateForm();
      });

    // Reset registration state when component initializes
    this.store.dispatch(AuthActions.resetRegistrationState());

    // Subscribe to auth state changes
    this.store.select(state => state.auth)
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.registration?.error) {
          this.showError(authState.registration.error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
      console.log('Submitting registration data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });

      this.store.dispatch(AuthActions.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password
      }));
    } else {
      this.validateForm();
      console.log('Form validation failed:', this.registerForm.errors);
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  private validateForm(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        if (control.invalid && control.touched) {
          control.markAsTouched();
        }
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private showError(message: string): void {
    console.error('Registration error:', message);
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['pattern']) {
        return 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters';
      }
      if (control.errors['maxlength']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is too long`;
      }
    }
    return '';
  }
} 