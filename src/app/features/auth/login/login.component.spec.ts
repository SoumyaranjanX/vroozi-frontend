// Angular testing utilities - v15.0.0
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

// NgRx testing utilities - v15.0.0
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';

// Component and dependencies
import { LoginComponent } from './login.component';
import { ErrorHandlerService } from '../../../shared/services/error-handler.service';
import * as AuthActions from '../../../store/actions/auth.actions';
import { UserRole } from '../../../shared/models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore;
  let router: Router;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  // Test data constants
  const validEmail = 'test@example.com';
  const validPassword = 'Test123!@#';
  const mockUser = {
    id: '123',
    email: validEmail,
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.BASIC_USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  };

  // Initial state setup
  const initialState = {
    auth: {
      user: null,
      loading: false,
      error: null,
      loginAttempts: 0
    }
  };

  beforeEach(async () => {
    // Create spy for ErrorHandlerService
    errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', redirectTo: '' }
        ])
      ],
      providers: [
        FormBuilder,
        provideMockStore({ initialState }),
        { provide: ErrorHandlerService, useValue: errorHandler }
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    store?.resetSelectors();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize login form with required controls', () => {
      expect(component.loginForm.get('email')).toBeTruthy();
      expect(component.loginForm.get('password')).toBeTruthy();
      expect(component.loginForm.get('rememberMe')).toBeTruthy();
    });

    it('should set initial form values to empty', () => {
      expect(component.loginForm.value).toEqual({
        email: '',
        password: '',
        rememberMe: false
      });
    });

    it('should mark form as invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    it('should validate required email', () => {
      const emailControl = component.loginForm.get('email');
      expect(emailControl?.errors?.['required']).toBeTruthy();
      
      emailControl?.setValue(validEmail);
      expect(emailControl?.errors).toBeNull();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue(validEmail);
      expect(emailControl?.errors).toBeNull();
    });

    it('should validate password complexity requirements', () => {
      const passwordControl = component.loginForm.get('password');
      
      // Test various invalid passwords
      const invalidPasswords = [
        'short', // Too short
        'nocapital123!', // No uppercase
        'NOCAPS123!', // No lowercase
        'NoNumbers!!', // No numbers
        'NoSpecial123' // No special characters
      ];

      invalidPasswords.forEach(password => {
        passwordControl?.setValue(password);
        expect(passwordControl?.errors?.['pattern']).toBeTruthy();
      });

      // Test valid password
      passwordControl?.setValue(validPassword);
      expect(passwordControl?.errors).toBeNull();
    });
  });

  describe('Authentication Flow', () => {
    it('should dispatch login action with valid credentials', fakeAsync(() => {
      const storeSpy = spyOn(store, 'dispatch');
      
      component.loginForm.setValue({
        email: validEmail,
        password: validPassword,
        rememberMe: false
      });

      component.onSubmit();
      tick();

      expect(storeSpy).toHaveBeenCalledWith(
        AuthActions.login({
          email: validEmail,
          password: validPassword,
          rememberMe: false
        })
      );
    }));

    it('should handle successful login', fakeAsync(() => {
      const routerSpy = spyOn(router, 'navigate');
      
      store.setState({
        auth: {
          user: mockUser,
          loading: false,
          error: null,
          loginAttempts: 0
        }
      });

      tick();
      fixture.detectChanges();

      expect(routerSpy).toHaveBeenCalledWith(['/dashboard']);
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBeNull();
    }));

    it('should handle login failure', fakeAsync(() => {
      const error = {
        code: 'AUTH_FAILED',
        message: 'Invalid credentials'
      };

      store.setState({
        auth: {
          user: null,
          loading: false,
          error,
          loginAttempts: 1
        }
      });

      tick();
      fixture.detectChanges();

      expect(component.error).toBe(error.message);
      expect(errorHandler.handleError).toHaveBeenCalled();
    }));
  });

  describe('Security Features', () => {
    it('should implement account lockout after max attempts', fakeAsync(() => {
      const maxAttempts = 5;
      
      // Simulate multiple failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        store.setState({
          auth: {
            user: null,
            loading: false,
            error: { code: 'AUTH_FAILED', message: 'Invalid credentials' },
            loginAttempts: i + 1
          }
        });
        tick();
      }

      fixture.detectChanges();
      expect(component.isLocked).toBeTrue();

      // Attempt login while locked
      component.onSubmit();
      expect(component.error).toContain('Account locked');

      // Verify lockout expires
      tick(component['LOCKOUT_DURATION']);
      expect(component.isLocked).toBeFalse();
    }));

    it('should sanitize and trim user input', fakeAsync(() => {
      const storeSpy = spyOn(store, 'dispatch');
      
      component.loginForm.setValue({
        email: `  ${validEmail}  `,
        password: validPassword,
        rememberMe: false
      });

      component.onSubmit();
      tick();

      expect(storeSpy).toHaveBeenCalledWith(
        AuthActions.login({
          email: validEmail,
          password: validPassword,
          rememberMe: false
        })
      );
    }));
  });

  describe('Error Handling', () => {
    it('should display field-level validation errors', () => {
      component.loginForm.markAllAsTouched();
      fixture.detectChanges();

      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      expect(component['fieldErrors'].get('email')).toBe('Email is required');
      expect(component['fieldErrors'].get('password')).toBe('Password is required');

      emailControl?.setValue('invalid-email');
      passwordControl?.setValue('weak');
      fixture.detectChanges();

      expect(component['fieldErrors'].get('email')).toBe('Please enter a valid email address');
      expect(component['fieldErrors'].get('password')).toContain('Password must contain');
    });

    it('should handle API errors', fakeAsync(() => {
      const apiError = {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      };

      store.setState({
        auth: {
          user: null,
          loading: false,
          error: apiError,
          loginAttempts: 1
        }
      });

      tick();
      fixture.detectChanges();

      expect(component.error).toBe(apiError.message);
      expect(errorHandler.handleError).toHaveBeenCalled();
    }));
  });
});