/**
 * Core types for Firestarter SDK - Clean TypeScript Implementation
 */

/**
 * Configuration for PipeClient
 */
export interface PipeConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Pipe Network account credentials
 * This is what developers need to interact with the API
 */
export interface PipeAccount {
  username: string;
  password: string;
  userId: string;
  userAppKey: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

/**
 * Account balance information
 */
export interface Balance {
  sol: number;
  pipe: number;
  publicKey: string;
}

/**
 * File upload options
 */
export interface UploadOptions {
  priority?: boolean;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

/**
 * Upload result from Pipe Network
 */
export interface UploadResult {
  fileId: string;
  fileName: string;
  size: number;
  blake3Hash: string;
  uploadedAt: Date;
}

/**
 * File record (for listing files)
 */
export interface FileRecord {
  fileId: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
  blake3Hash: string;
  metadata?: Record<string, any>;
}

/**
 * Credentials generated from wallet address
 */
export interface WalletCredentials {
  username: string;
  password: string;
}

/**
 * Public link information for sharing files
 */
export interface PublicLink {
  linkHash: string;
  fileName: string;
  shareUrl: string;
}

/**
 * Options for creating a public link
 */
export interface PublicLinkOptions {
  customTitle?: string;
  customDescription?: string;
}
