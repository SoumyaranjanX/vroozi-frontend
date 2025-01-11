// @angular/core v15.0.0
import { Injectable } from '@angular/core';
// crypto-js v4.1.1
import * as CryptoJS from 'crypto-js';
import { Subject } from 'rxjs';

// Constants
const STORAGE_PREFIX = 'cps_';
const ENCRYPTION_KEY = process.env.STORAGE_ENCRYPTION_KEY || 'defaultKey';

// Interfaces
interface StorageOptions {
  secureOverwrite?: boolean;
  compression?: boolean;
  compressionThreshold?: number;
  quota?: number;
}

interface StorageEvent {
  type: 'set' | 'remove' | 'clear';
  key?: string;
  timestamp: number;
}

interface StorageQuota {
  max: number;
  warning: number;
}

interface CompressionOptions {
  enabled: boolean;
  threshold: number;
}

interface StorageMetadata {
  encrypted: boolean;
  compressed: boolean;
  timestamp: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly storagePrefix: string = STORAGE_PREFIX;
  private readonly encryptionKey: string = ENCRYPTION_KEY;
  public readonly storageChange$ = new Subject<StorageEvent>();
  
  private readonly quotaLimit: StorageQuota = {
    max: 5 * 1024 * 1024, // 5MB
    warning: 4 * 1024 * 1024 // 4MB
  };

  private readonly compressionConfig: CompressionOptions = {
    enabled: true,
    threshold: 1024 // 1KB
  };

  constructor() {
    this.validateStorageAvailability();
    this.setupStorageEventListener();
  }

  /**
   * Stores data in localStorage with optional encryption and compression
   * @param key Storage key
   * @param value Data to store
   * @param encrypt Whether to encrypt the data
   * @param options Storage options
   */
  public setItem<T>(
    key: string,
    value: T,
    encrypt: boolean = false,
    options: StorageOptions = {}
  ): void {
    try {
      this.validateKey(key);
      this.checkQuota();

      const prefixedKey = this.getPrefixedKey(key);
      let serializedData = JSON.stringify(value);
      
      const metadata: StorageMetadata = {
        encrypted: encrypt,
        compressed: false,
        timestamp: Date.now(),
        size: new Blob([serializedData]).size
      };

      // Compress if enabled and exceeds threshold
      if (options.compression !== false && 
          metadata.size > (options.compressionThreshold || this.compressionConfig.threshold)) {
        serializedData = this.compress(serializedData);
        metadata.compressed = true;
      }

      // Encrypt if requested
      if (encrypt) {
        serializedData = this.encrypt(serializedData);
      }

      // Store data with metadata
      localStorage.setItem(prefixedKey, serializedData);
      localStorage.setItem(`${prefixedKey}_meta`, JSON.stringify(metadata));

      this.emitStorageEvent('set', key);
    } catch (err) {
      console.error(`Error storing item ${key}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error(`Failed to store item: ${errorMessage}`);
    }
  }

  /**
   * Retrieves and deserializes data from localStorage
   * @param key Storage key
   * @param decrypt Whether to decrypt the data
   * @returns Deserialized data or null if not found
   */
  public getItem<T>(key: string, decrypt: boolean = false): T | null {
    try {
      this.validateKey(key);
      const prefixedKey = this.getPrefixedKey(key);
      
      const serializedData = localStorage.getItem(prefixedKey);
      if (!serializedData) {
        return null;
      }

      const metadata: StorageMetadata = JSON.parse(
        localStorage.getItem(`${prefixedKey}_meta`) || '{}'
      );

      let data = serializedData;

      // Decrypt if necessary
      if (decrypt && metadata.encrypted) {
        data = this.decrypt(data);
      }

      // Decompress if necessary
      if (metadata.compressed) {
        data = this.decompress(data);
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Error retrieving item ${key}:`, error);
      return null;
    }
  }

  /**
   * Securely removes data from localStorage
   * @param key Storage key
   * @param options Storage options
   */
  public removeItem(key: string, options: StorageOptions = {}): void {
    try {
      this.validateKey(key);
      const prefixedKey = this.getPrefixedKey(key);

      if (options.secureOverwrite) {
        // Securely overwrite before removal
        const randomData = CryptoJS.lib.WordArray.random(1024).toString();
        localStorage.setItem(prefixedKey, randomData);
      }

      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(`${prefixedKey}_meta`);

      this.emitStorageEvent('remove', key);
    } catch (err) {
      console.error(`Error removing item ${key}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error(`Failed to remove item: ${errorMessage}`);
    }
  }

  /**
   * Clears all service-related data from localStorage
   * @param options Storage options
   */
  public clear(options: StorageOptions = {}): void {
    try {
      const keys = this.getServiceKeys();

      if (options.secureOverwrite) {
        // Securely overwrite all items before clearing
        keys.forEach(key => {
          const randomData = CryptoJS.lib.WordArray.random(1024).toString();
          localStorage.setItem(key, randomData);
        });
      }

      keys.forEach(key => {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_meta`);
      });

      this.emitStorageEvent('clear');
    } catch (err) {
      console.error('Error clearing storage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      throw new Error(`Failed to clear storage: ${errorMessage}`);
    }
  }

  /**
   * Checks if an item exists in localStorage
   * @param key Storage key
   * @returns boolean indicating if item exists
   */
  public hasItem(key: string): boolean {
    try {
      this.validateKey(key);
      const prefixedKey = this.getPrefixedKey(key);
      return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`Error checking item ${key}:`, error);
      return false;
    }
  }

  // Private helper methods
  private validateStorageAvailability(): void {
    if (!window.localStorage) {
      throw new Error('localStorage is not available in this environment');
    }

    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      throw new Error('localStorage is not accessible');
    }
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid storage key');
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  private decrypt(data: string): string {
    const bytes = CryptoJS.AES.decrypt(data, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private compress(data: string): string {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
  }

  private decompress(data: string): string {
    const words = CryptoJS.enc.Base64.parse(data);
    return CryptoJS.enc.Utf8.stringify(words);
  }

  private checkQuota(): void {
    const totalSize = this.calculateStorageSize();
    if (totalSize > this.quotaLimit.max) {
      throw new Error('Storage quota exceeded');
    }
    if (totalSize > this.quotaLimit.warning) {
      console.warn('Storage usage approaching quota limit');
    }
  }

  private calculateStorageSize(): number {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        totalSize += new Blob([localStorage.getItem(key) || '']).size;
      }
    }
    return totalSize;
  }

  private getServiceKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.storagePrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private setupStorageEventListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(this.storagePrefix)) {
        this.storageChange$.next({
          type: event.newValue ? 'set' : 'remove',
          key: event.key.replace(this.storagePrefix, ''),
          timestamp: Date.now()
        });
      }
    });
  }

  private emitStorageEvent(type: 'set' | 'remove' | 'clear', key?: string): void {
    this.storageChange$.next({
      type,
      key,
      timestamp: Date.now()
    });
  }
}