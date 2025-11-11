/**
 * Simple localStorage wrapper for Pipe accounts
 *
 * This is OPTIONAL - developers can manage storage however they want.
 * Provides a convenient way to save/load accounts from localStorage.
 */

import type { PipeAccount, FileRecord } from '../types';

const STORAGE_KEY = 'firestarter_pipe_account';
const FILES_STORAGE_KEY = 'firestarter_file_records';

/**
 * Simple wrapper for storing Pipe account credentials in localStorage
 *
 * @example
 * ```ts
 * const storage = new PipeAccountStorage();
 *
 * // Save account after login
 * const account = await client.login(username, password);
 * storage.save(account);
 *
 * // Load account on app startup
 * const savedAccount = storage.load();
 * if (savedAccount) {
 *   // Use saved account
 *   await client.uploadFile(savedAccount, file, 'example.txt');
 * }
 *
 * // Clear on logout
 * storage.clear();
 * ```
 */
export class PipeAccountStorage {
  private storage: Storage;
  private storageKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage not available');
    }
    this.storage = window.localStorage;
    this.storageKey = storageKey;
  }

  /**
   * Save account to localStorage
   */
  save(account: PipeAccount): void {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(account));
    } catch (error) {
      console.error('Failed to save account to localStorage:', error);
      throw error;
    }
  }

  /**
   * Load account from localStorage
   * Returns null if no account is saved
   */
  load(): PipeAccount | null {
    try {
      const data = this.storage.getItem(this.storageKey);
      if (!data) return null;

      const account = JSON.parse(data) as PipeAccount;

      // Validate required fields
      if (!account.username || !account.password || !account.userId) {
        console.warn('Invalid account data in localStorage, clearing');
        this.clear();
        return null;
      }

      return account;
    } catch (error) {
      console.error('Failed to load account from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear saved account from localStorage
   */
  clear(): void {
    try {
      this.storage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear account from localStorage:', error);
    }
  }

  /**
   * Check if an account is saved
   */
  hasAccount(): boolean {
    return this.storage.getItem(this.storageKey) !== null;
  }
}

/**
 * Simple wrapper for tracking uploaded files in localStorage
 *
 * Since Pipe Network doesn't provide a file listing API,
 * this helps you keep track of what you've uploaded.
 *
 * @example
 * ```ts
 * const fileStorage = new PipeFileStorage();
 *
 * // After uploading a file
 * const result = await client.uploadFile(account, file, 'example.txt');
 * fileStorage.addFile({
 *   fileId: result.fileId,
 *   fileName: result.fileName,
 *   size: result.size,
 *   uploadedAt: result.uploadedAt,
 *   blake3Hash: result.blake3Hash,
 * });
 *
 * // List all uploaded files
 * const files = fileStorage.listFiles();
 *
 * // Remove a file record (after deletion)
 * fileStorage.removeFile(fileId);
 * ```
 */
export class PipeFileStorage {
  private storage: Storage;
  private storageKey: string;
  private maxFiles: number;

  constructor(storageKey: string = FILES_STORAGE_KEY, maxFiles: number = 1000) {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage not available');
    }
    this.storage = window.localStorage;
    this.storageKey = storageKey;
    this.maxFiles = maxFiles;
  }

  /**
   * Create a PipeFileStorage instance scoped to a specific account
   * This ensures files are tracked separately per account
   *
   * @param account - The account to scope storage to
   * @param maxFiles - Maximum number of files to track (default 1000)
   * @returns PipeFileStorage instance scoped to the account
   *
   * @example
   * ```ts
   * const fileStorage = PipeFileStorage.forAccount(account);
   *
   * // After uploading
   * const result = await client.uploadFile(account, file, 'example.txt');
   * fileStorage.addFile(result);
   *
   * // List files for this account only
   * const files = fileStorage.listFiles();
   * ```
   */
  static forAccount(account: PipeAccount, maxFiles: number = 1000): PipeFileStorage {
    const storageKey = `firestarter_files_${account.username}`;
    return new PipeFileStorage(storageKey, maxFiles);
  }

  /**
   * Add a file record to storage
   */
  addFile(file: FileRecord): void {
    try {
      const files = this.listFiles();

      // Check if file already exists (by fileId)
      const existingIndex = files.findIndex((f) => f.fileId === file.fileId);
      if (existingIndex >= 0) {
        // Update existing record
        files[existingIndex] = file;
      } else {
        // Add new record
        files.unshift(file); // Add to beginning (most recent first)

        // Limit total files stored
        if (files.length > this.maxFiles) {
          files.splice(this.maxFiles);
        }
      }

      this.storage.setItem(this.storageKey, JSON.stringify(files));
    } catch (error) {
      console.error('Failed to add file record to localStorage:', error);
    }
  }

  /**
   * List all stored file records
   */
  listFiles(): FileRecord[] {
    try {
      const data = this.storage.getItem(this.storageKey);
      if (!data) return [];

      const files = JSON.parse(data) as FileRecord[];

      // Convert date strings back to Date objects
      return files.map((f) => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt),
      }));
    } catch (error) {
      console.error('Failed to list files from localStorage:', error);
      return [];
    }
  }

  /**
   * Get a specific file record by ID
   */
  getFile(fileId: string): FileRecord | null {
    const files = this.listFiles();
    return files.find((f) => f.fileId === fileId) || null;
  }

  /**
   * Remove a file record from storage
   */
  removeFile(fileId: string): void {
    try {
      const files = this.listFiles();
      const filtered = files.filter((f) => f.fileId !== fileId);
      this.storage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove file record from localStorage:', error);
    }
  }

  /**
   * Clear all file records
   */
  clear(): void {
    try {
      this.storage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear file records from localStorage:', error);
    }
  }

  /**
   * Get total number of files stored
   */
  count(): number {
    return this.listFiles().length;
  }
}
