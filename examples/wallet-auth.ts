// Wallet Authentication Example - Using wallet-based credentials

import { PipeClient, generateCredentialsFromAddress } from 'firestarter-sdk';

async function main() {
  const client = new PipeClient();
  
  // Your Solana wallet address
  const walletAddress = '7xKXtg2CW87d97TXJSDpbD6Fo7XNM28fJCRKKXCyJKVh';
  
  // Generate deterministic credentials from wallet
  const creds = generateCredentialsFromAddress(walletAddress);
  console.log('Username:', creds.username);
  
  // Try to login, create if doesn't exist
  let account;
  try {
    account = await client.login(creds.username, creds.password);
    console.log('✅ Logged in');
  } catch (error) {
    console.log('Account does not exist, creating...');
    account = await client.createAccount(creds.username, creds.password);
    console.log('✅ Account created');
  }
  
  // Now use account for uploads/downloads
  const balance = await client.getBalance(account);
  console.log('PIPE Balance:', balance.pipe);
}

main();
