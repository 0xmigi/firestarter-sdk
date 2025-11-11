/**
 * PipeClient - Clean TypeScript client for Pipe Network
 *
 * This is a straightforward HTTP client for Pipe Network API.
 * No magic, no automatic authentication, no hidden state.
 * Developer provides account credentials explicitly for each operation.
 */

import axios, { AxiosInstance } from 'axios';
import type {
  PipeConfig,
  PipeAccount,
  Balance,
  UploadOptions,
  UploadResult,
  FileRecord,
  PublicLink,
  PublicLinkOptions,
} from './types.js';
import { PipeApiError, PipeValidationError, PipeErrorCode } from './errors.js';
import { assertValidUsername, assertValidPassword, assertValidAmount } from './validation.js';

export class PipeClient {
  private baseUrl: string;
  private api: AxiosInstance;

  constructor(config: PipeConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://us-west-01-firestarter.pipenetwork.com';

    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'User-Agent': 'FirestarterSDK/2.0.0',
      },
    });

    // Simple response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Pipe API authentication failed - token may be expired');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a new Pipe Network account
   *
   * @param username - Username (must be 8+ characters)
   * @param password - Password (must be 8+ characters)
   * @returns Account credentials needed for all operations
   */
  async createAccount(username: string, password: string): Promise<PipeAccount> {
    // Validate inputs
    assertValidUsername(username);
    assertValidPassword(password);

    try {
      // Step 1: Create user account
      const createResponse = await this.api.post('/users', { username });

      if (createResponse.status !== 200) {
        throw new PipeApiError('Failed to create user account', createResponse.status);
      }

      const userData = createResponse.data;

      // Step 2: Set password (also returns JWT tokens)
      const passwordResponse = await this.api.post('/auth/set-password', {
        user_id: userData.user_id,
        user_app_key: userData.user_app_key,
        new_password: password,
      });

      if (passwordResponse.status !== 200) {
        throw new PipeApiError('Failed to set password', passwordResponse.status);
      }

      const tokens = passwordResponse.data;

      return {
        username,
        password,
        userId: userData.user_id,
        userAppKey: userData.user_app_key,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: Date.now() + tokens.expires_in * 1000,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new PipeApiError(
          'Username already exists. Please choose a different username.',
          409,
          PipeErrorCode.USERNAME_EXISTS
        );
      }
      throw new PipeApiError(
        `Failed to create account: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Login to existing Pipe Network account
   *
   * @param username - Account username
   * @param password - Account password
   * @returns Account credentials needed for all operations
   */
  async login(username: string, password: string): Promise<PipeAccount> {
    if (!username || !password) {
      throw new PipeValidationError('Username and password required');
    }

    try {
      // Login to get JWT tokens
      const loginResponse = await this.api.post('/auth/login', {
        username,
        password,
      });

      if (loginResponse.status !== 200) {
        throw new PipeApiError('Login failed', loginResponse.status);
      }

      const tokens = loginResponse.data;

      // Try to get user details from checkWallet
      // This might fail for some accounts, but that's ok - we can still use JWT auth
      let actualUserId = username;
      let actualUserAppKey = tokens.access_token; // Default to JWT token

      try {
        const walletResponse = await this.api.post(
          '/checkWallet',
          {},
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );

        if (walletResponse.status === 200 && walletResponse.data.user_id) {
          actualUserId = walletResponse.data.user_id;
        }
      } catch (checkWalletError) {
        // checkWallet failed, but we can still use JWT auth
        console.warn('checkWallet failed, using JWT token for auth');
      }

      return {
        username,
        password,
        userId: actualUserId,
        userAppKey: actualUserAppKey,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: Date.now() + tokens.expires_in * 1000,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new PipeApiError(
          'Invalid username or password',
          401,
          PipeErrorCode.INVALID_CREDENTIALS
        );
      }
      throw new PipeApiError(
        `Login failed: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Get balance (SOL and PIPE tokens) for an account
   *
   * @param account - Account credentials
   * @returns Balance information
   */
  async getBalance(account: PipeAccount): Promise<Balance> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      // Get SOL balance
      const walletResponse = await this.api.post(
        '/checkWallet',
        {},
        { headers: authHeaders }
      );

      // Get PIPE token balance
      let pipeBalance = 0;
      try {
        const tokenResponse = await this.api.post(
          '/checkCustomToken',
          {
            token_mint: '35mhJor7qTD212YXdLkB8sRzTbaYRXmTzHTCFSDP5voJ', // PIPE token
          },
          { headers: authHeaders }
        );
        pipeBalance = tokenResponse.data.ui_amount || 0;
      } catch (error) {
        // PIPE balance check may fail if no tokens, that's ok
        console.warn('PIPE balance check failed, defaulting to 0');
      }

      return {
        sol: walletResponse.data.balance_sol || 0,
        pipe: pipeBalance,
        publicKey: walletResponse.data.public_key || '',
      };
    } catch (error: any) {
      throw new PipeApiError(
        `Failed to get balance: ${error.message}`,
        error.response?.status
      );
    }
  }

  /**
   * Upload a file to Pipe Network
   *
   * @param account - Account credentials
   * @param file - File data (Buffer or Uint8Array)
   * @param fileName - Name for the file
   * @param options - Optional upload options
   * @returns Upload result with file ID
   */
  async uploadFile(
    account: PipeAccount,
    file: File | Buffer | Uint8Array,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      // Convert File to Uint8Array if needed (browser environment)
      let data: Buffer | Uint8Array;
      if (file instanceof File || file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        data = new Uint8Array(arrayBuffer);
      } else {
        data = file;
      }

      // Build upload URL with filename
      const url = new URL(`${this.baseUrl}/upload`);
      url.searchParams.append('file_name', fileName);

      // Upload as binary stream
      const response = await axios.post(url.toString(), data, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length.toString(),
        },
        timeout: 0, // No timeout - uploads can take as long as needed
        onUploadProgress: options.onProgress ? (progressEvent) => {
          if (progressEvent.total && options.onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(percent);
          }
        } : undefined,
      });

      if (response.status !== 200 && response.status !== 202) {
        throw new PipeApiError(`Upload failed: ${response.status}`);
      }

      // Calculate blake3 hash for file ID
      const blake3Hash = await this.calculateBlake3Hash(data);

      return {
        fileId: blake3Hash,
        fileName,
        size: data.length,
        blake3Hash,
        uploadedAt: new Date(),
      };
    } catch (error: any) {
      if (error.response?.status === 402) {
        throw new PipeApiError(
          'Insufficient PIPE balance. Please deposit more PIPE tokens to upload files.',
          402,
          PipeErrorCode.INSUFFICIENT_BALANCE
        );
      }
      if (error.response?.status === 401) {
        throw new PipeApiError(
          'Authentication failed. Please login again.',
          401,
          PipeErrorCode.UNAUTHORIZED
        );
      }
      throw new PipeApiError(
        `Upload failed: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UPLOAD_FAILED
      );
    }
  }

  /**
   * List files for an account
   * Note: Pipe Network doesn't provide a listing API yet,
   * so this returns an empty array. Use local storage tracking if needed.
   *
   * @param account - Account credentials
   * @returns List of files (currently empty - use storage wrapper for tracking)
   */
  async listFiles(account: PipeAccount): Promise<FileRecord[]> {
    // Pipe Network doesn't have a file listing endpoint yet
    // Developers should use PipeFileStorage to track uploads locally
    console.warn('listFiles: Pipe Network does not provide file listing API. Use PipeFileStorage for local tracking.');
    return [];
  }

  /**
   * Download a file from Pipe Network
   *
   * IMPORTANT: The fileName parameter must be the ORIGINAL filename used during upload,
   * not the blake3 hash! The Pipe API /download-stream endpoint requires the original filename.
   *
   * @param account - Account credentials
   * @param fileName - Original filename used during upload (NOT the blake3 hash)
   * @returns File data as Uint8Array
   */
  async downloadFile(account: PipeAccount, fileName: string): Promise<Uint8Array> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      const downloadUrl = new URL(`${this.baseUrl}/download-stream`);
      downloadUrl.searchParams.append('file_name', fileName);

      const response = await axios.get(downloadUrl.toString(), {
        headers: authHeaders,
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      if (response.status !== 200) {
        throw new PipeApiError(`Download failed: ${response.status}`);
      }

      return new Uint8Array(response.data);
    } catch (error: any) {
      throw new PipeApiError(
        `Download failed: ${error.message}`,
        error.response?.status
      );
    }
  }

  /**
   * Delete a file from Pipe Network
   *
   * @param account - Account credentials
   * @param fileName - File name or blake3 hash
   * @returns Success status
   */
  async deleteFile(account: PipeAccount, fileName: string): Promise<void> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      // Use POST method with parameters in request body
      const response = await this.api.post(
        '/deleteFile',
        {
          user_id: account.userId,
          user_app_key: account.userAppKey,
          file_name: fileName,
        },
        {
          headers: authHeaders,
        }
      );

      if (response.status !== 200) {
        throw new PipeApiError(`Delete failed: ${response.status}`, response.status, PipeErrorCode.DELETE_FAILED);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new PipeApiError(
          'File not found',
          404,
          PipeErrorCode.FILE_NOT_FOUND
        );
      }
      throw new PipeApiError(
        `Delete failed: ${error.message}`,
        error.response?.status,
        PipeErrorCode.DELETE_FAILED
      );
    }
  }

  /**
   * Create a public shareable link for a file
   *
   * @param account - Account credentials
   * @param fileName - File name or blake3 hash
   * @param options - Optional title and description for social media previews
   * @returns Public link information
   */
  async createPublicLink(
    account: PipeAccount,
    fileName: string,
    options?: PublicLinkOptions
  ): Promise<PublicLink> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      const response = await this.api.post(
        '/createPublicLink',
        {
          user_id: account.userId,
          user_app_key: account.userAppKey,
          file_name: fileName,
          custom_title: options?.customTitle,
          custom_description: options?.customDescription,
        },
        { headers: authHeaders }
      );

      const { link_hash, public_url } = response.data;

      // Use the server-provided public_url if available, otherwise construct it
      const shareUrl = public_url || `${this.baseUrl}/publicDownload?hash=${link_hash}`;

      return {
        linkHash: link_hash,
        fileName,
        shareUrl,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new PipeApiError(
          'File not found',
          404,
          PipeErrorCode.FILE_NOT_FOUND
        );
      }
      throw new PipeApiError(
        `Failed to create public link: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Delete a public link
   *
   * @param account - Account credentials
   * @param linkHash - The hash of the public link to delete
   * @returns Success status
   */
  async deletePublicLink(account: PipeAccount, linkHash: string): Promise<void> {
    const authHeaders = await this.getAuthHeaders(account);

    try {
      const response = await this.api.delete('/deletePublicLink', {
        headers: authHeaders,
        data: {
          user_id: account.userId,
          user_app_key: account.userAppKey,
          link_hash: linkHash,
        },
      });

      if (response.status !== 200) {
        throw new PipeApiError(
          `Failed to delete public link: ${response.status}`,
          response.status
        );
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new PipeApiError(
          'Public link not found',
          404,
          PipeErrorCode.FILE_NOT_FOUND
        );
      }
      throw new PipeApiError(
        `Failed to delete public link: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Download a file using a public link (no authentication required)
   *
   * @param linkHash - The public link hash
   * @returns File data as Uint8Array
   */
  async publicDownload(linkHash: string): Promise<Uint8Array> {
    try {
      const response = await this.api.get(`/public/${linkHash}`, {
        responseType: 'arraybuffer',
      });

      if (response.status !== 200) {
        throw new PipeApiError(`Public download failed: ${response.status}`, response.status);
      }

      return new Uint8Array(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new PipeApiError(
          'Public link not found or expired',
          404,
          PipeErrorCode.FILE_NOT_FOUND
        );
      }
      throw new PipeApiError(
        `Public download failed: ${error.message}`,
        error.response?.status,
        PipeErrorCode.DOWNLOAD_FAILED
      );
    }
  }

  /**
   * Exchange SOL for PIPE tokens
   *
   * @param account - Account credentials
   * @param solAmount - Amount of SOL to exchange
   * @returns Amount of PIPE tokens received
   */
  async exchangeSolForPipe(account: PipeAccount, solAmount: number): Promise<number> {
    assertValidAmount(solAmount);

    const authHeaders = await this.getAuthHeaders(account);

    try {
      const response = await this.api.post(
        '/exchangeSolForTokens',
        { amount_sol: solAmount },
        { headers: authHeaders }
      );

      const data = response.data;
      return data.tokens_minted || data.pipe_tokens || data.amount || 0;
    } catch (error: any) {
      if (error.response?.status === 402) {
        throw new PipeApiError(
          'Insufficient SOL balance for exchange',
          402,
          PipeErrorCode.INSUFFICIENT_SOL
        );
      }
      throw new PipeApiError(
        `Exchange failed: ${error.message}`,
        error.response?.status,
        PipeErrorCode.UNKNOWN
      );
    }
  }

  /**
   * Get authentication headers for API requests
   * Handles token refresh if needed
   */
  private async getAuthHeaders(account: PipeAccount): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // Check if JWT token is still valid
    if (account.accessToken && account.tokenExpiry && Date.now() < account.tokenExpiry) {
      headers['Authorization'] = `Bearer ${account.accessToken}`;
      return headers;
    }

    // Token expired, try to refresh
    if (account.refreshToken) {
      try {
        const refreshResponse = await this.api.post('/auth/refresh', {
          refresh_token: account.refreshToken,
        });

        if (refreshResponse.status === 200) {
          const tokens = refreshResponse.data;

          // Update account with new tokens
          account.accessToken = tokens.access_token;
          account.refreshToken = tokens.refresh_token || account.refreshToken;
          account.tokenExpiry = Date.now() + tokens.expires_in * 1000;

          headers['Authorization'] = `Bearer ${tokens.access_token}`;
          return headers;
        }
      } catch (error) {
        console.warn('Token refresh failed, attempting re-login');
      }
    }

    // Refresh failed, try to re-login
    if (account.username && account.password) {
      try {
        const loginResponse = await this.api.post('/auth/login', {
          username: account.username,
          password: account.password,
        });

        if (loginResponse.status === 200) {
          const tokens = loginResponse.data;

          account.accessToken = tokens.access_token;
          account.refreshToken = tokens.refresh_token;
          account.tokenExpiry = Date.now() + tokens.expires_in * 1000;

          headers['Authorization'] = `Bearer ${tokens.access_token}`;
          return headers;
        }
      } catch (error) {
        throw new PipeApiError('Authentication failed - unable to refresh or re-login', 401);
      }
    }

    // Fallback to legacy auth if we have userAppKey
    if (account.userAppKey && account.userAppKey !== 'jwt-based') {
      headers['X-User-Id'] = account.userId;
      headers['X-User-App-Key'] = account.userAppKey;
      return headers;
    }

    throw new PipeApiError('No valid authentication available', 401);
  }

  /**
   * Calculate Blake3 hash for content addressing
   */
  private async calculateBlake3Hash(data: Buffer | Uint8Array): Promise<string> {
    try {
      const { blake3 } = await import('@noble/hashes/blake3');
      const hashBytes = blake3(data, { dkLen: 32 });
      return Array.from(hashBytes, (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    } catch (error) {
      // Fallback to SHA256 if blake3 not available
      console.warn('Blake3 not available, falling back to SHA256');
      const { sha256 } = await import('@noble/hashes/sha256');
      const hashBytes = sha256(data);
      return Array.from(hashBytes, (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');
    }
  }
}
