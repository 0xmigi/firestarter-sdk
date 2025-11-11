import { PipeValidationError } from './errors';

/**
 * Validation constants for Pipe Network accounts
 */
export const USERNAME_MIN_LENGTH = 8;
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate username according to Pipe Network requirements
 * @param username - Username to validate
 * @returns Validation result with error message if invalid
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Username is required',
    };
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  // Check for valid characters (alphanumeric and underscore)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Validate password according to Pipe Network requirements
 * Note: The API only requires 8+ characters, but strong passwords are recommended
 * @param password - Password to validate
 * @param strict - If true, enforce strong password requirements (default: false)
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string, strict: boolean = false): ValidationResult {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      error: 'Password is required',
    };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }

  // Only enforce strength requirements if strict mode is enabled
  if (strict) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    if (!hasUppercase) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (!hasLowercase) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (!hasNumber) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (!hasSymbol) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate amount for transactions
 * @param amount - Amount to validate
 * @returns Validation result with error message if invalid
 */
export function validateAmount(amount: number): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      valid: false,
      error: 'Amount must be a valid number',
    };
  }

  if (amount <= 0) {
    return {
      valid: false,
      error: 'Amount must be greater than 0',
    };
  }

  return { valid: true };
}

/**
 * Assert username is valid, throw PipeValidationError if not
 * @param username - Username to validate
 * @throws PipeValidationError if validation fails
 */
export function assertValidUsername(username: string): void {
  const result = validateUsername(username);
  if (!result.valid) {
    throw new PipeValidationError(result.error!);
  }
}

/**
 * Assert password is valid, throw PipeValidationError if not
 * @param password - Password to validate
 * @param strict - If true, enforce strong password requirements (default: false)
 * @throws PipeValidationError if validation fails
 */
export function assertValidPassword(password: string, strict: boolean = false): void {
  const result = validatePassword(password, strict);
  if (!result.valid) {
    throw new PipeValidationError(result.error!);
  }
}

/**
 * Assert amount is valid, throw PipeValidationError if not
 * @param amount - Amount to validate
 * @throws PipeValidationError if validation fails
 */
export function assertValidAmount(amount: number): void {
  const result = validateAmount(amount);
  if (!result.valid) {
    throw new PipeValidationError(result.error!);
  }
}
