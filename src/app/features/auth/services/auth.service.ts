// Angular imports - v15.0.0
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser } from '../../../shared/models/user.model';
import { Router } from '@angular/router';

// RxJS imports - v7.8.0
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

/**
 * Response types for auth endpoints
 */
export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

/**
 * Authentication service handling user authentication and token management
 * Implements secure token storage and automatic refresh
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<IUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize user from localStorage on service creation
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Authenticates user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Observable of auth response
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      map(response => ({
        ...response,
        tokenExpiry: new Date(response.tokenExpiry)
      })),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          code: error.error?.code || 'AUTH_ERROR',
          message: error.error?.message || 'Authentication failed'
        }));
      })
    );
  }

  /**
   * Logs out the current user
   * @returns Observable of void
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      catchError(error => {
        console.error('Logout error:', error);
        return throwError(() => ({
          code: error.error?.code || 'AUTH_ERROR',
          message: error.error?.message || 'Logout failed'
        }));
      })
    );
  }

  /**
   * Refreshes the access token using a refresh token
   * @param refreshToken Current refresh token
   * @returns Observable of auth response
   */
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      map(response => ({
        ...response,
        tokenExpiry: new Date(response.tokenExpiry)
      })),
      catchError(error => {
        console.error('Token refresh error:', error);
        return throwError(() => ({
          code: error.error?.code || 'AUTH_ERROR',
          message: error.error?.message || 'Token refresh failed'
        }));
      })
    );
  }

  /**
   * Checks if the current token is expired
   * @param tokenExpiry Token expiry date
   * @returns True if token is expired
   */
  isTokenExpired(tokenExpiry: Date): boolean {
    return new Date() > new Date(tokenExpiry);
  }

  /**
   * Gets the stored access token
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Gets the stored refresh token
   * @returns Refresh token or null
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Checks if the user is authenticated
   * @returns True if the user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  updateUser(userId: string, userData: Partial<IUser>): Observable<IUser> {
    return this.http.put<IUser>(`${this.apiUrl}/users/${userId}`, userData).pipe(
      tap((updatedUser: IUser) => {
        // Update the stored user data
        const currentUser = this.userSubject.getValue();
        const mergedUser = { ...currentUser, ...updatedUser };
        
        // Update both the subject and localStorage
        this.userSubject.next(mergedUser);
        localStorage.setItem('user', JSON.stringify(mergedUser));
        
        // Log the update
        console.log('User data updated:', mergedUser);
      }),
      catchError((error) => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }
} 