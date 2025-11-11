# Firestarter SDK

**TypeScript client for Pipe Network decentralized storage.**

Simple, explicit, and framework-agnostic. Build decentralized storage into your JavaScript applications with straightforward API calls.

## Installation

```bash
npm install firestarter-sdk
```

## Quick Start

```typescript
import { PipeClient } from 'firestarter-sdk';

const client = new PipeClient();

// 1. Login or create account
const account = await client.login('myusername', 'mypassword');
// or: await client.createAccount('myusername', 'mypassword');

// 2. Upload a file
const file = new File([...], 'document.pdf');
const result = await client.uploadFile(account, file, 'document.pdf', {
  onProgress: (percent) => console.log(`${percent}%`)
});

// 3. Download file (use original filename!)
const data = await client.downloadFile(account, 'document.pdf');
```

## Core Features

### Account Management

```typescript
// Create new account
const account = await client.createAccount(username, password);

// Login to existing account
const account = await client.login(username, password);

// Check balance
const balance = await client.getBalance(account);
// Returns: { sol: number, pipe: number, publicKey: string }
```

### File Operations

```typescript
// Upload
const result = await client.uploadFile(account, file, 'filename.txt', {
  onProgress: (percent) => console.log(`Progress: ${percent}%`)
});

// Download (IMPORTANT: use original filename, not blake3 hash)
const data = await client.downloadFile(account, 'filename.txt');

// Delete
await client.deleteFile(account, fileId);
```

### Token Operations

```typescript
// Exchange SOL for PIPE tokens
const pipeAmount = await client.exchangeSolForPipe(account, 0.1); // 0.1 SOL
```

## Usage Patterns

### With Wallet Address (Deterministic)

Generate the same account from a wallet address every time:

```typescript
import { generateCredentialsFromAddress } from 'firestarter-sdk';

const creds = generateCredentialsFromAddress(walletAddress);

// Try login, create if doesn't exist
let account;
try {
  account = await client.login(creds.username, creds.password);
} catch (e) {
  account = await client.createAccount(creds.username, creds.password);
}
```

### With localStorage Persistence

Save credentials so users don't re-login every time:

```typescript
import { PipeAccountStorage } from 'firestarter-sdk';

const storage = new PipeAccountStorage();

let account = storage.load();
if (!account) {
  account = await client.login(username, password);
  storage.save(account);
}
```

### React Hooks

```tsx
import { useFileUpload, useBalance } from 'firestarter-sdk';

function MyComponent({ account }) {
  const { upload, uploading, progress } = useFileUpload(account);
  const { balance, loading } = useBalance(account);

  return (
    <div>
      <p>PIPE Balance: {balance?.pipe}</p>
      <input
        type="file"
        onChange={(e) => upload(e.target.files[0], e.target.files[0].name)}
      />
      {uploading && <p>Uploading: {progress}%</p>}
    </div>
  );
}
```

### With Privy Integration

```tsx
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { PipeClient, generateCredentialsFromAddress } from 'firestarter-sdk';

function App() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [pipeAccount, setPipeAccount] = useState(null);

  const connectStorage = async () => {
    const creds = generateCredentialsFromAddress(wallets[0].address);
    try {
      const account = await client.login(creds.username, creds.password);
      setPipeAccount(account);
    } catch (e) {
      const account = await client.createAccount(creds.username, creds.password);
      setPipeAccount(account);
    }
  };

  return authenticated && <button onClick={connectStorage}>Connect Storage</button>;
}
```

## Local File Tracking

Pipe Network doesn't provide a file listing API. Track uploads locally:

```typescript
import { PipeFileStorage } from 'firestarter-sdk';

const fileStorage = new PipeFileStorage();

// After upload
const result = await client.uploadFile(account, file, 'example.txt');
fileStorage.addFile(result);

// List files
const files = fileStorage.listFiles();

// Remove file
fileStorage.removeFile(fileId);
```

## Error Handling

```typescript
import { PipeApiError, PipeValidationError } from 'firestarter-sdk';

try {
  await client.login(username, password);
} catch (error) {
  if (error instanceof PipeApiError) {
    console.error('API error:', error.status, error.message);
  } else if (error instanceof PipeValidationError) {
    console.error('Validation error:', error.message);
  }
}
```

## TypeScript Types

```typescript
interface PipeAccount {
  username: string;
  password: string;
  userId: string;
  userAppKey: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

interface Balance {
  sol: number;
  pipe: number;
  publicKey: string;
}

interface UploadResult {
  fileId: string;        // blake3 hash
  fileName: string;      // original filename (use this for downloads!)
  size: number;
  blake3Hash: string;
  uploadedAt: Date;
}
```

## Examples

See [examples/](./examples) for complete working code:

- **[basic-usage.ts](./examples/basic-usage.ts)** - Simplest possible usage
- **[react-example.tsx](./examples/react-example.tsx)** - React component
- **[wallet-auth.ts](./examples/wallet-auth.ts)** - Wallet-based credentials

## When to Use SDK vs Direct API

| **Use SDK When...** | **Use Direct API When...** |
|---------------------|----------------------------|
| ✅ Building JavaScript/TypeScript app | ✅ Using another language (Python, Go, Rust) |
| ✅ Want automatic JWT token management | ✅ Need custom authentication flow |
| ✅ Need React hooks | ✅ Using different framework |
| ✅ Want typed errors & responses | ✅ Prefer raw HTTP responses |

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed HTTP endpoint documentation.

## Design

- ✅ **Explicit API** - Clear, straightforward method calls
- ✅ **Developer Control** - You manage authentication and state
- ✅ **Framework Agnostic** - Works in Node.js, React, Vue, Svelte, vanilla JS
- ✅ **TypeScript First** - Full type safety and IntelliSense support

## License

MIT

## Links

**Firestarter SDK:**
- NPM Package: https://www.npmjs.com/package/firestarter-sdk
- GitHub: https://github.com/0xmigi/firestarter-sdk
- Issues: https://github.com/0xmigi/firestarter-sdk/issues

**Pipe Network:**
- Website: https://pipe.network/
- Documentation: https://docs.pipe.network/
- CLI Tool: https://github.com/PipeNetwork/pipe
