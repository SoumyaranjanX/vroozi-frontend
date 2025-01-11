// @angular/core/testing v15.0.0
import { 
  ComponentFixture, 
  TestBed, 
  fakeAsync, 
  tick, 
  flush 
} from '@angular/core/testing';

// rxjs v7.8.0
import { 
  BehaviorSubject, 
  Subject, 
  throwError 
} from 'rxjs';

// Internal imports
import { AppComponent } from './app.component';
import { ThemeService } from './core/services/theme.service';
import { LoadingService } from './core/services/loading.service';

/**
 * Enhanced mock theme service with error simulation capabilities
 */
class MockThemeService {
  private _theme$ = new BehaviorSubject<string>('light-theme');
  private _themeError$ = new Subject<Error>();
  private _shouldSimulateError = false;

  theme$ = this._theme$.asObservable();
  themeError$ = this._themeError$.asObservable();

  setTheme(theme: string): void {
    if (this._shouldSimulateError) {
      this._themeError$.next(new Error('Theme error'));
    } else {
      this._theme$.next(theme);
    }
  }

  loadSavedTheme(): void {
    if (this._shouldSimulateError) {
      throw new Error('Theme loading error');
    }
  }

  simulateError(shouldError: boolean): void {
    this._shouldSimulateError = shouldError;
  }

  reset(): void {
    this._theme$.next('light-theme');
    this._shouldSimulateError = false;
  }
}

/**
 * Enhanced mock loading service with error simulation capabilities
 */
class MockLoadingService {
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _loadingError$ = new Subject<Error>();
  private _shouldSimulateError = false;

  loading$ = this._loading$.asObservable();
  loadingError$ = this._loadingError$.asObservable();

  show(): void {
    if (this._shouldSimulateError) {
      this._loadingError$.next(new Error('Loading error'));
    } else {
      this._loading$.next(true);
    }
  }

  hide(): void {
    if (this._shouldSimulateError) {
      this._loadingError$.next(new Error('Loading error'));
    } else {
      this._loading$.next(false);
    }
  }

  getLoadingState() {
    return this._loading$.asObservable();
  }

  simulateError(shouldError: boolean): void {
    this._shouldSimulateError = shouldError;
  }

  reset(): void {
    this._loading$.next(false);
    this._shouldSimulateError = false;
  }
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let themeService: MockThemeService;
  let loadingService: MockLoadingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: ThemeService, useClass: MockThemeService },
        { provide: LoadingService, useClass: MockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as unknown as MockThemeService;
    loadingService = TestBed.inject(LoadingService) as unknown as MockLoadingService;
  });

  afterEach(() => {
    themeService.reset();
    loadingService.reset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Theme Management', () => {
    it('should initialize with default theme', fakeAsync(() => {
      fixture.detectChanges();
      let currentTheme: string | undefined;
      
      component.currentTheme.subscribe(theme => {
        currentTheme = theme;
      });

      tick();
      expect(currentTheme).toBe('light-theme');
    }));

    it('should handle theme service errors gracefully', fakeAsync(() => {
      themeService.simulateError(true);
      fixture.detectChanges();
      
      let themeError: Error | undefined;
      component.themeError$.subscribe(error => {
        themeError = error;
      });

      themeService.setTheme('dark-theme');
      tick();

      expect(themeError).toBeTruthy();
      expect(themeError?.message).toBe('Theme error');
    }));

    it('should handle theme initialization errors', fakeAsync(() => {
      themeService.simulateError(true);
      const consoleSpy = spyOn(console, 'error');
      
      fixture.detectChanges();
      tick();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error initializing theme:',
        jasmine.any(Error)
      );
    }));
  });

  describe('Loading State Management', () => {
    it('should track loading state changes', fakeAsync(() => {
      fixture.detectChanges();
      let isLoading = false;
      
      component.isLoading.subscribe(state => {
        isLoading = state;
      });

      loadingService.show();
      tick();
      expect(isLoading).toBe(true);

      loadingService.hide();
      tick();
      expect(isLoading).toBe(false);
    }));

    it('should handle loading service errors', fakeAsync(() => {
      loadingService.simulateError(true);
      fixture.detectChanges();
      
      let loadingError: Error | undefined;
      component.loadingError$.subscribe(error => {
        loadingError = error;
      });

      loadingService.show();
      tick();

      expect(loadingError).toBeTruthy();
      expect(loadingError?.message).toBe('Loading error');
    }));

    it('should handle loading state error gracefully', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      loadingService.simulateError(true);
      
      fixture.detectChanges();
      loadingService.show();
      tick();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in loading state:',
        jasmine.any(Error)
      );
    }));
  });

  describe('Lifecycle Management', () => {
    it('should initialize component with proper subscriptions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeTruthy();
      expect(component.currentTheme).toBeTruthy();
      expect(component.loadingError$).toBeTruthy();
      expect(component.themeError$).toBeTruthy();
    }));

    it('should cleanup subscriptions on destroy', fakeAsync(() => {
      fixture.detectChanges();
      
      let themeUpdated = false;
      component.currentTheme.subscribe(() => {
        themeUpdated = true;
      });

      component.ngOnDestroy();
      themeService.setTheme('dark-theme');
      tick();

      expect(themeUpdated).toBe(false);
    }));

    it('should handle async operations properly', fakeAsync(() => {
      fixture.detectChanges();
      let themeValue: string | undefined;
      let loadingValue: boolean | undefined;

      component.currentTheme.subscribe(theme => {
        themeValue = theme;
      });
      component.isLoading.subscribe(loading => {
        loadingValue = loading;
      });

      themeService.setTheme('dark-theme');
      loadingService.show();
      tick();

      expect(themeValue).toBe('dark-theme');
      expect(loadingValue).toBe(true);

      loadingService.hide();
      flush();

      expect(loadingValue).toBe(false);
    }));
  });

  describe('Error Boundaries', () => {
    it('should contain theme errors within error boundary', fakeAsync(() => {
      fixture.detectChanges();
      const consoleSpy = spyOn(console, 'error');
      themeService.simulateError(true);

      component.ngOnInit();
      tick();

      expect(consoleSpy).toHaveBeenCalled();
      // Component should still be stable
      expect(component).toBeTruthy();
    }));

    it('should handle multiple simultaneous errors', fakeAsync(() => {
      fixture.detectChanges();
      themeService.simulateError(true);
      loadingService.simulateError(true);

      let themeError: Error | undefined;
      let loadingError: Error | undefined;

      component.themeError$.subscribe(error => {
        themeError = error;
      });
      component.loadingError$.subscribe(error => {
        loadingError = error;
      });

      themeService.setTheme('dark-theme');
      loadingService.show();
      tick();

      expect(themeError).toBeTruthy();
      expect(loadingError).toBeTruthy();
    }));
  });
});