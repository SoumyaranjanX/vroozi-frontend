/**
 * @fileoverview Enhanced authentication service implementing secure JWT-based authentication
 * with comprehensive session management and role-based access control.
 * @version 1.0.0
 * @license MIT
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IUser, IUserResponse, IRegistrationResponse } from '../../shared/models/user.model';
import { Router } from '@angular/router';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // Observable streams
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user && !!this.getToken()));

  constructor(
    private http: HttpClient,
    private router: Router,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }): Observable<IRegistrationResponse> {
    return this.http.post<IRegistrationResponse>(`${this.apiUrl}/auth/register`, data);
  }

  login(email: string, password: string): Observable<IUserResponse> {
    console.log('AuthService: Making login API call to:', `${this.apiUrl}/auth/login`);
    return this.http
      .post<IUserResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          console.log('AuthService: Login API response:', response);
          if (response && response.user) {
            this.storeAuthData(response);
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError(error => {
          console.error('AuthService: Login API error:', error);
          this.clearAuthData();
          this.currentUserSubject.next(null);
          throw error;
        })
      );
  }

  logout(): Observable<void> {
    // Clear local state immediately
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.loadingService.hide();
    this.router.navigate(['/auth/login']);

    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = this.getToken();

    // If we don't have an access token, just return
    if (!accessToken) {
      return new Observable(subscriber => {
        subscriber.next();
        subscriber.complete();
      });
    }

    // Prepare request body - only include refresh token if it exists
    const body = refreshToken ? { refresh_token: refreshToken } : {};

    // Make the backend call but don't wait for it
    this.http.post<void>(`${this.apiUrl}/auth/logout`, body)
      .pipe(
        catchError(error => {
          console.error('AuthService: Logout error:', error);
          return of(void 0); // Ignore errors during logout
        })
      )
      .subscribe();

    // Return immediately
    return new Observable(subscriber => {
      subscriber.next();
      subscriber.complete();
    });
  }

  // refreshToken(token: string): Observable<IUserResponse> {
  //   return this.http.post<IUserResponse>(`${this.apiUrl}/auth/refresh`, { token }).pipe(
  //     tap(response => {
  //       this.storeAuthData(response);
  //     })
  //   );
  // }
  // Attempt to refresh the token
  public refreshToken(): Observable<IUserResponse> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    return this.http
      .post<IUserResponse>(
        `${this.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(response => {
          if (response && response.user) {
            this.storeAuthData(response);
            this.currentUserSubject.next(response.user);
            this.refreshTokenSubject.next(response);
          } else {
            this.refreshTokenSubject.next(null);
            throw new Error('Invalid refresh token response');
          }
        }),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.refreshTokenSubject.next(null);
          throw error;
        }),
        finalize(() => {
          this.refreshTokenInProgress = false;
        })
      );
  }

  public handleTokenExpiration(): void {
    // Only attempt refresh if we're not already in progress
    if (!this.refreshTokenInProgress) {
      this.refreshToken().subscribe({
        next: response => {
          if (!response) {
            this.handleSessionExpired();
          }
        },
        error: () => {
          this.handleSessionExpired();
        },
      });
    }
  }

  public handleSessionExpired(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.loadingService.hide();
    this.notificationService.showWarning('Your session has expired. Please log in again.');

    // Navigate to login with return URL
    const currentUrl = window.location.pathname;
    this.router.navigate(['/auth/login'], {
      queryParams: { 
        expired: 'true',
        returnUrl: currentUrl !== '/auth/login' ? currentUrl : undefined
      }
    });
  }

  // Helper methods
  public getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private storeAuthData(response: IUserResponse): void {
    console.log('AuthService: Storing auth data');
    if (!response.user || !response.accessToken) {
      console.error('AuthService: Invalid response data', response);
      throw new Error('Invalid authentication response');
    }
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    localStorage.setItem('accessToken', response.accessToken);
    // localStorage.setItem('refreshToken', response.refreshToken);
    // localStorage.setItem('tokenExpiry', new Date(response.tokenExpiry).toISOString());
  }

  private clearAuthData(): void {
    console.log('AuthService: Clearing auth data');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');
    // localStorage.removeItem('tokenExpiry');
  }

  // Getters
  public get currentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.getToken();
  }

  updateCurrentUser(user: IUser): void {
    // Update the BehaviorSubject with new user data
    this.currentUserSubject.next(user);
    // Update localStorage to persist the changes
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
}
