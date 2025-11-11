// Basic Usage Example - Simplest possible SDK usage

import { PipeClient, PipeAccountStorage, PipeFileStorage } from 'firestarter-sdk';

async function main() {
  const client = new PipeClient();
  const storage = new PipeAccountStorage();
  
  // Login or create
  let account = storage.load();
  if (!account) {
    account = await client.createAccount('myuser', 'SecurePass123!');
    storage.save(account);
  }
  
  // Check balance
  const balance = await client.getBalance(account);
  console.log('PIPE:', balance.pipe);
  
  // Upload
  const data = Buffer.from('Hello Pipe!');
  const result = await client.uploadFile(account, data, 'test.txt');
  console.log('Uploaded:', result.fileId);
  
  // Download (use fileName not fileId!)
  const downloaded = await client.downloadFile(account, 'test.txt');
  console.log('Content:', downloaded.toString());
}

main();
