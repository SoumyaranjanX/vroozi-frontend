// @angular/core v15.0.0
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  constructor() {
    this.loadThemePreference();
  }

  private loadThemePreference(): void {
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    this.isDarkThemeSubject.next(isDarkTheme);
    this.applyTheme(isDarkTheme);
  }

  toggleTheme(): void {
    const newValue = !this.isDarkThemeSubject.value;
    this.isDarkThemeSubject.next(newValue);
    localStorage.setItem('darkTheme', newValue.toString());
    this.applyTheme(newValue);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}