/**
 * Credential generation utilities
 *
 * These utilities help generate deterministic credentials from wallet addresses.
 * This is OPTIONAL - developers can manage credentials however they want.
 */

import { sha256 } from '@noble/hashes/sha256';
import type { WalletCredentials } from '../types.js';

/**
 * Generate deterministic credentials from a wallet address
 *
 * This creates the same username/password every time for a given wallet address.
 * Useful if you want wallet-based authentication without requiring signatures.
 *
 * NOTE: This is NOT cryptographically secure like signature-based auth would be.
 * The credentials are deterministic and could be guessed if someone knows your wallet address.
 *
 * @param walletAddress - Solana wallet address
 * @returns Deterministic username and password
 *
 * @example
 * ```ts
 * const creds = generateCredentialsFromAddress('7xKXtg2CW...');
 * // creds.username: 'pipe_7xKXtg2C'
 * // creds.password: 'Fs_abc123...'
 *
 * // Try to login with generated credentials
 * let account;
 * try {
 *   account = await client.login(creds.username, creds.password);
 * } catch (e) {
 *   // Account doesn't exist, create it
 *   account = await client.createAccount(creds.username, creds.password);
 * }
 * ```
 */
export function generateCredentialsFromAddress(walletAddress: string): WalletCredentials {
  if (!walletAddress || walletAddress.length < 8) {
    throw new Error('Invalid wallet address');
  }

  // Generate deterministic username from wallet address
  const usernameHash = sha256(new TextEncoder().encode(`username:${walletAddress}`));
  const usernameHex = Array.from(usernameHash, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const username = 'pipe_' + usernameHex.slice(0, 20); // pipe_<20 hex chars> = 25 chars total

  // Generate deterministic password from wallet address (different salt)
  const passwordHash = sha256(new TextEncoder().encode(`password:${walletAddress}:v1`));
  const passwordHex = Array.from(passwordHash, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const password = 'Fs_' + passwordHex.slice(0, 29); // Fs_<29 hex chars> = 32 chars total

  return { username, password };
}

/**
 * Generate deterministic credentials from a wallet signature
 *
 * This is MORE secure than address-based generation because it requires the user
 * to actually sign a message, proving they own the wallet.
 *
 * @param signature - Base64 encoded signature
 * @param walletAddress - Wallet address (for additional entropy)
 * @returns Deterministic username and password
 *
 * @example
 * ```ts
 * // In your app with wallet integration
 * const message = `Authenticate Pipe Storage\n\nWallet: ${walletAddress}\n\nThis creates your storage account.`;
 * const signature = await wallet.signMessage(message);
 *
 * const creds = generateCredentialsFromSignature(
 *   btoa(String.fromCharCode(...signature)),
 *   walletAddress
 * );
 *
 * // Try login/create
 * let account;
 * try {
 *   account = await client.login(creds.username, creds.password);
 * } catch (e) {
 *   account = await client.createAccount(creds.username, creds.password);
 * }
 * ```
 */
export function generateCredentialsFromSignature(
  signature: string,
  walletAddress: string
): WalletCredentials {
  if (!signature || !walletAddress) {
    throw new Error('Signature and wallet address required');
  }

  // Combine signature and wallet for entropy
  const combined = `${signature}:${walletAddress}`;

  // Generate username from signature
  const usernameHash = sha256(new TextEncoder().encode(`username:${combined}`));
  const usernameHex = Array.from(usernameHash, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const username = 'pipe_' + usernameHex.slice(0, 20);

  // Generate password from signature (different salt)
  const passwordHash = sha256(new TextEncoder().encode(`password:${combined}:v1`));
  const passwordHex = Array.from(passwordHash, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const password = 'Fs_' + passwordHex.slice(0, 29);

  return { username, password };
}
