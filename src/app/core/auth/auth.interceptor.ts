import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { LoadingService } from '../services/loading.service';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService, private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loading indicator for refresh token requests
    if (!this.isAuthRequest(request.url)) {
      this.loadingService.show();
    }

    // Don't intercept auth requests
    if (this.isAuthRequest(request.url)) {
      return next.handle(request.clone({ withCredentials: true })).pipe(finalize(() => this.loadingService.hide()));
    }

    // Clone the request and add base URL for non-external requests
    request = this.addBaseUrl(request);

    // Add authorization header if needed
    if (!this.isAuthRequest(request.url)) {
      request = this.addAuthHeader(request);
    }

    // Add credentials for cookie handling
    request = request.clone({ withCredentials: true });

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      }),
      finalize(() => {
        if (!this.isAuthRequest(request.url)) {
          this.loadingService.hide();
        }
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(token => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addAuthHeader(request));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.handleSessionExpired();
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => next.handle(this.addAuthHeader(request)))
    );
  }

  private addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);
      if (this.isTokenValid(decodedToken)) {
        return request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Token is expired or invalid, trigger refresh
        this.authService.handleTokenExpiration();
      }
    }
    return request;
  }

  private isTokenValid(decodedToken: any): boolean {
    if (!decodedToken || !decodedToken.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const tokenBuffer = 30; // 30 seconds buffer before expiration
    return decodedToken.exp > currentTime + tokenBuffer;
  }

  private addBaseUrl(request: HttpRequest<any>): HttpRequest<any> {
    if (!this.isExternalRequest(request.url)) {
      return request.clone({
        url: `${environment.apiUrl}${request.url}`,
      });
    }
    return request;
  }

  private isAuthRequest(url: string): boolean {
    const authPaths = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout'];
    return authPaths.some(path => url.includes(path));
  }

  private isExternalRequest(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  private setSecurityHeaders(request: HttpRequest<any>): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        ...request.headers,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  }
}
