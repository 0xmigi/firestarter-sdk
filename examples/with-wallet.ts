/**
 * Wallet-Based Authentication Example
 *
 * This example shows how to generate deterministic credentials from a wallet address.
 * Useful if you want the same account every time for a given wallet.
 */

import { PipeClient, generateCredentialsFromAddress, PipeAccountStorage } from '../src';

async function main() {
  const client = new PipeClient();

  // Pattern 2: Deterministic credentials from wallet address
  console.log('=== Pattern 2: Wallet-Based Credentials ===\n');

  // Simulate a Solana wallet address
  const walletAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  console.log('Wallet Address:', walletAddress);

  // Generate deterministic credentials
  const creds = generateCredentialsFromAddress(walletAddress);
  console.log('Generated Username:', creds.username);
  console.log('Generated Password:', creds.password.slice(0, 10) + '...');

  // Try to login, create if doesn't exist
  let account;
  try {
    console.log('\nAttempting login...');
    account = await client.login(creds.username, creds.password);
    console.log('✓ Logged into existing account');
  } catch (error: any) {
    if (error.status === 401) {
      console.log('Account doesn\'t exist, creating...');
      account = await client.createAccount(creds.username, creds.password);
      console.log('✓ Created new account');
    } else {
      throw error;
    }
  }

  // Pattern 3: Save to localStorage (optional)
  console.log('\n=== Pattern 3: With localStorage ===\n');

  // Note: This only works in browser environments
  // In Node.js, we'll skip this part
  if (typeof window !== 'undefined') {
    const storage = new PipeAccountStorage();

    // Check if we have a saved account
    const savedAccount = storage.load();
    if (savedAccount) {
      console.log('✓ Found saved account:', savedAccount.username);
      account = savedAccount;
    } else {
      console.log('No saved account, saving current account...');
      storage.save(account);
      console.log('✓ Account saved to localStorage');
    }
  } else {
    console.log('(localStorage only available in browser)');
  }

  // Use the account
  console.log('\n=== Using the Account ===\n');
  const balance = await client.getBalance(account);
  console.log('SOL Balance:', balance.sol);
  console.log('PIPE Balance:', balance.pipe);

  // Upload a file
  const fileData = new TextEncoder().encode(`File from wallet ${walletAddress}`);
  const result = await client.uploadFile(account, fileData, 'wallet-test.txt');
  console.log('✓ File uploaded:', result.fileId);

  console.log('\n=== Key Benefit ===');
  console.log('The same wallet address will ALWAYS generate the same credentials.');
  console.log('This means the same account works across sessions and devices.');
  console.log('No need to save credentials - just derive them from the wallet!');
}

// Run the example
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
