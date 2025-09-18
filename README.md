# Firestarter SDK

TypeScript SDK for Pipe Network's Firestarter API with upload tracking and session management.

## Features

- 🚀 **Simple API** - Easy to use client for Pipe Network's Firestarter service
- 📝 **Upload Tracking** - Automatically track uploaded files for gallery functionality
- 👥 **Session Management** - Multi-user session handling for decentralized applications
- 📊 **File Management** - List, search, and manage uploaded files
- 💰 **Token Operations** - SOL/PIPE balance checking and token swapping
- 🔗 **Public Links** - Create shareable links for files
- ⚡ **TypeScript** - Full type safety and autocomplete

## Installation

```bash
npm install firestarter-sdk
# or
yarn add firestarter-sdk
```

## Quick Start

### Basic Usage

```typescript
import { createSessionManager } from 'firestarter-sdk';

const sessionManager = createSessionManager();

// Upload a file
const file = fs.readFileSync('photo.jpg');
const result = await sessionManager.uploadForUser(
  'user123',
  file,
  'photo.jpg'
);

// List user's files
const files = await sessionManager.listUserFiles('user123');
console.log('User has', files.length, 'files');
```

### DApp Integration

```typescript
import { SessionManager } from 'firestarter-sdk';

const manager = new SessionManager({
  baseUrl: 'https://us-west-00-firestarter.pipenetwork.com'
});

// Upload user content
const result = await manager.uploadCameraCapture(
  walletAddress,
  imageBuffer,
  'photo'
);

// Get recent files for gallery
const recentFiles = await manager.getRecentUserFiles(walletAddress, 20);
```

### Direct Client Usage

```typescript
import { PipeClient } from 'firestarter-sdk';

const client = new PipeClient();

// Create user account
const user = await client.createUser('myusername');

// Upload file
const uploadResult = await client.upload(
  user,
  fileBuffer,
  'document.pdf'
);

// Check balances
const solBalance = await client.checkSolBalance(user);
const pipeBalance = await client.checkPipeBalance(user);
```

## API Reference

### SessionManager

The main class for managing multiple users and file tracking.

```typescript
class SessionManager {
  // Upload files
  uploadForUser(userId: string, data: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult>
  uploadCameraCapture(userId: string, imageData: Buffer, captureType?: string): Promise<UploadResult>

  // File management
  listUserFiles(userId: string): Promise<FileRecord[]>
  searchUserFiles(userId: string, pattern: string): Promise<FileRecord[]>
  getRecentUserFiles(userId: string, limit: number): Promise<FileRecord[]>

  // User operations
  getUserBalance(userId: string): Promise<{sol: number, pipe: number, publicKey: string}>
  exchangeSolForPipe(userId: string, amountSol: number): Promise<number>
  createPublicLink(userId: string, fileName: string): Promise<string>

  // Monitoring
  getUploadStats(): Promise<Stats>
  getActiveSessionCount(): number
  cleanupInactiveSessions(): number
}
```

### PipeClient

Low-level client for direct Pipe Network API access.

```typescript
class PipeClient {
  createUser(username: string): Promise<PipeUser>
  upload(user: PipeUser, data: Buffer, fileName: string, options?: UploadOptions): Promise<UploadResult>
  download(user: PipeUser, fileName: string, priority?: boolean): Promise<Buffer>
  createPublicLink(user: PipeUser, fileName: string): Promise<string>
  checkSolBalance(user: PipeUser): Promise<WalletBalance>
  checkPipeBalance(user: PipeUser): Promise<TokenBalance>
  exchangeSolForPipe(user: PipeUser, amountSol: number): Promise<number>
}
```

### Types

```typescript
interface FileRecord {
  fileId: string;
  originalFileName: string;
  storedFileName: string;
  userId: string;
  uploadedAt: Date;
  size: number;
  mimeType?: string;
  blake3Hash?: string;
  metadata: Record<string, any>;
}

interface UploadOptions {
  priority?: boolean;
  fileName?: string;
  metadata?: Record<string, any>;
}

interface PipeUser {
  userId: string;
  userAppKey: string;
  username?: string;
  solanaPubkey?: string;
}
```

## Configuration

```typescript
const config = {
  baseUrl: 'https://us-west-00-firestarter.pipenetwork.com', // Default
  timeout: 30000, // 30 seconds
};

const sessionManager = new SessionManager(config, './uploads.json');
```

## Error Handling

```typescript
import { PipeApiError, PipeValidationError } from 'firestarter-sdk';

try {
  await sessionManager.uploadForUser(userId, data, fileName);
} catch (error) {
  if (error instanceof PipeApiError) {
    console.log('API Error:', error.message, 'Status:', error.status);
  } else if (error instanceof PipeValidationError) {
    console.log('Validation Error:', error.message);
  }
}
```

## Local Storage

Upload history is stored locally in JSON format (like the Pipe CLI). Default location: `~/.firestarter/uploads.json`

You can specify a custom path:

```typescript
const manager = new SessionManager(config, '/custom/path/uploads.json');
```

## Testing

```bash
npm test
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Run tests and ensure they pass
5. Submit a pull request

## Support

- GitHub Issues: [Report bugs](https://github.com/0xmigi/firestarter-sdk/issues)
- Documentation: [Full API docs](https://github.com/0xmigi/firestarter-sdk)