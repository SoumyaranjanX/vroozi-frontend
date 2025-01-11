import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { ProfileService } from '@core/services/profile.service';
import { ThemeService } from '@core/services/theme.service';
import { IUser } from '@shared/models/user.model';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: IUser | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isDarkTheme$: Observable<boolean>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private themeService: ThemeService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]]
    });
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.profileService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const updateData = {
        ...this.currentUser,
        firstName: this.profileForm.get('firstName')?.value,
        lastName: this.profileForm.get('lastName')?.value,
      };

      this.profileService.updateProfile(updateData)
        .pipe(
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (updatedUser) => {
            this.successMessage = 'Profile updated successfully';
            this.currentUser = {
              ...this.currentUser,
              ...updatedUser
            };
            this.authService.updateCurrentUser(this.currentUser);
          },
          error: (error: Error) => {
            this.errorMessage = error.message || 'Failed to update profile';
          }
        });
    }
  }
} 