import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { IUser, UserRole } from '@shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<IUser> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map(response => ({
        ...response,
        firstName: response.first_name,
        lastName: response.last_name
      }))
    );
  }

  updateProfile(userData: Partial<IUser>): Observable<IUser> {
    // Convert the data to match backend expectations
    const updateData = {
      first_name: userData.firstName,
      last_name: userData.lastName
    };

    return this.http.put<any>(`${this.apiUrl}`, updateData).pipe(
      map(response => ({
        ...response,
        firstName: response.first_name,
        lastName: response.last_name
      }))
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }
} 