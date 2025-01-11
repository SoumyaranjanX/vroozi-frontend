import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private fontSizeSubject = new BehaviorSubject<number>(16);
  private highContrastSubject = new BehaviorSubject<boolean>(false);

  fontSize$ = this.fontSizeSubject.asObservable();
  highContrast$ = this.highContrastSubject.asObservable();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedHighContrast = localStorage.getItem('highContrast');

    if (savedFontSize) {
      this.setFontSize(parseInt(savedFontSize, 10));
    }

    if (savedHighContrast) {
      this.setHighContrast(savedHighContrast === 'true');
    }
  }

  setFontSize(size: number): void {
    this.fontSizeSubject.next(size);
    localStorage.setItem('fontSize', size.toString());
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
  }

  setHighContrast(enabled: boolean): void {
    this.highContrastSubject.next(enabled);
    localStorage.setItem('highContrast', enabled.toString());
    document.body.classList.toggle('high-contrast', enabled);
  }

  increaseFontSize(): void {
    const currentSize = this.fontSizeSubject.value;
    if (currentSize < 24) {
      this.setFontSize(currentSize + 2);
    }
  }

  decreaseFontSize(): void {
    const currentSize = this.fontSizeSubject.value;
    if (currentSize > 12) {
      this.setFontSize(currentSize - 2);
    }
  }

  resetFontSize(): void {
    this.setFontSize(16);
  }

  toggleHighContrast(): void {
    this.setHighContrast(!this.highContrastSubject.value);
  }
}