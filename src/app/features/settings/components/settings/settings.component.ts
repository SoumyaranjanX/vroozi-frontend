import { Component, OnInit } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import { Observable } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  isDarkTheme$: Observable<boolean>;
  emailNotifications = true;
  pushNotifications = true;

  constructor(private themeService: ThemeService) {
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    // Load user preferences here
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleEmailNotifications(event: MatSlideToggleChange): void {
    this.emailNotifications = event.checked;
    // TODO: Save preference to backend
  }

  togglePushNotifications(event: MatSlideToggleChange): void {
    this.pushNotifications = event.checked;
    // TODO: Save preference to backend
  }
} 