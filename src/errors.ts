/**
 * Standard error codes returned by the SDK
 */
export enum PipeErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Account errors
  USERNAME_EXISTS = 'USERNAME_EXISTS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',

  // File operation errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',

  // Balance errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_SOL = 'INSUFFICIENT_SOL',

  // Validation errors
  INVALID_USERNAME = 'INVALID_USERNAME',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  INVALID_AMOUNT = 'INVALID_AMOUNT',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

export class PipeApiError extends Error {
  public status?: number;
  public code: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'PipeApiError';
    this.status = status;
    this.code = code || PipeErrorCode.UNKNOWN;
  }

  static fromResponse(response: any): PipeApiError {
    const message = response.data?.message || response.statusText || 'Unknown API error';
    return new PipeApiError(message, response.status, response.data?.code);
  }

  /**
   * Create a PipeApiError from an HTTP status code with user-friendly message
   */
  static fromStatus(status: number, defaultMessage?: string): PipeApiError {
    switch (status) {
      case 401:
        return new PipeApiError(
          'Authentication failed. Please check your credentials.',
          401,
          PipeErrorCode.UNAUTHORIZED
        );
      case 402:
        return new PipeApiError(
          'Insufficient PIPE balance. Please deposit more PIPE tokens.',
          402,
          PipeErrorCode.INSUFFICIENT_BALANCE
        );
      case 404:
        return new PipeApiError(
          'Resource not found.',
          404,
          PipeErrorCode.FILE_NOT_FOUND
        );
      case 409:
        return new PipeApiError(
          'Username already exists. Please choose a different username.',
          409,
          PipeErrorCode.USERNAME_EXISTS
        );
      default:
        return new PipeApiError(
          defaultMessage || `Request failed with status ${status}`,
          status,
          PipeErrorCode.UNKNOWN
        );
    }
  }
}

export class PipeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PipeValidationError';
  }
}

export class PipeSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PipeSessionError';
  }
}

export class PipeStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PipeStorageError';
  }
}