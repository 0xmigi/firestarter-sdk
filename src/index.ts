/**
 * Firestarter SDK - Clean TypeScript implementation for Pipe Network
 *
 * A straightforward HTTP client for Pipe Network decentralized storage.
 * No magic, no automatic authentication, no hidden state.
 *
 * @example Basic usage
 * ```ts
 * import { PipeClient } from 'firestarter-sdk';
 *
 * const client = new PipeClient();
 *
 * // Login or create account
 * const account = await client.login('myusername', 'mypassword');
 *
 * // Upload a file
 * const file = new Uint8Array([...]);
 * const result = await client.uploadFile(account, file, 'example.txt');
 *
 * // Download a file
 * const data = await client.downloadFile(account, result.fileId);
 * ```
 *
 * @example With wallet credentials
 * ```ts
 * import { PipeClient, generateCredentialsFromAddress } from 'firestarter-sdk';
 *
 * const client = new PipeClient();
 * const creds = generateCredentialsFromAddress(walletAddress);
 *
 * // Try login, create if doesn't exist
 * let account;
 * try {
 *   account = await client.login(creds.username, creds.password);
 * } catch (e) {
 *   account = await client.createAccount(creds.username, creds.password);
 * }
 * ```
 *
 * @example With localStorage
 * ```ts
 * import { PipeClient, PipeAccountStorage } from 'firestarter-sdk';
 *
 * const client = new PipeClient();
 * const storage = new PipeAccountStorage();
 *
 * // Check for saved account
 * let account = storage.load();
 * if (!account) {
 *   account = await client.login(username, password);
 *   storage.save(account);
 * }
 * ```
 */

// Core client
export { PipeClient } from './client.js';

// Types
export type {
  PipeConfig,
  PipeAccount,
  Balance,
  UploadOptions,
  UploadResult,
  FileRecord,
  WalletCredentials,
  PublicLink,
  PublicLinkOptions,
} from './types.js';

// Errors
export {
  PipeApiError,
  PipeValidationError,
  PipeSessionError,
  PipeStorageError,
  PipeErrorCode,
} from './errors.js';

// Validation
export {
  USERNAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateUsername,
  validatePassword,
  validateAmount,
  assertValidUsername,
  assertValidPassword,
  assertValidAmount,
} from './validation.js';

export type { ValidationResult } from './validation.js';

// Utilities
export {
  generateCredentialsFromAddress,
  generateCredentialsFromSignature,
} from './utils/credentials.js';

export { PipeAccountStorage, PipeFileStorage } from './utils/storage.js';

// React hooks (optional)
export {
  usePipeClient,
  useFileUpload,
  useBalance,
  useFileDownload,
  useTrackedFiles,
} from './react/index.js';
