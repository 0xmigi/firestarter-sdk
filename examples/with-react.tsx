/**
 * React Integration Example
 *
 * This example shows how to use the SDK with React hooks.
 * Clean, explicit, no magic.
 */

import React, { useState } from 'react';
import {
  PipeClient,
  PipeAccount,
  useFileUpload,
  useBalance,
  useFileDownload,
  PipeFileStorage,
  FileRecord,
} from '../src';

/**
 * Simple storage app component
 */
function StorageApp() {
  const [account, setAccount] = useState<PipeAccount | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);

  const client = new PipeClient();
  const fileStorage = new PipeFileStorage();

  // Use hooks - they need the account
  const { upload, uploading, progress, error: uploadError } = useFileUpload(account);
  const { balance, loading: balanceLoading, refresh: refreshBalance } = useBalance(account);
  const { download, downloading, error: downloadError } = useFileDownload(account);

  // Handle login
  const handleLogin = async () => {
    try {
      const acc = await client.login(username, password);
      setAccount(acc);

      // Load files from local storage
      const savedFiles = fileStorage.listFiles();
      setFiles(savedFiles);
    } catch (error: any) {
      alert(`Login failed: ${error.message}`);
    }
  };

  // Handle create account
  const handleCreateAccount = async () => {
    try {
      const acc = await client.createAccount(username, password);
      setAccount(acc);
      setFiles([]);
    } catch (error: any) {
      alert(`Create account failed: ${error.message}`);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !account) return;

    const result = await upload(file, file.name);
    if (result) {
      // Save to local storage
      fileStorage.addFile({
        fileId: result.fileId,
        fileName: result.fileName,
        size: result.size,
        uploadedAt: result.uploadedAt,
        blake3Hash: result.blake3Hash,
      });

      // Refresh file list
      setFiles(fileStorage.listFiles());

      alert('File uploaded successfully!');
    }
  };

  // Handle file download
  const handleDownload = async (fileId: string, fileName: string) => {
    const data = await download(fileId);
    if (data) {
      // Create blob and trigger download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle file delete
  const handleDelete = async (fileId: string) => {
    if (!account) return;

    try {
      await client.deleteFile(account, fileId);
      fileStorage.removeFile(fileId);
      setFiles(fileStorage.listFiles());
      alert('File deleted!');
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setAccount(null);
    setUsername('');
    setPassword('');
    setFiles([]);
  };

  // Not logged in - show login form
  if (!account) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Pipe Storage Demo</h1>
        <p>Simple React integration with Firestarter SDK v2</p>

        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <button onClick={handleLogin} style={{ marginRight: '10px' }}>
            Login
          </button>
          <button onClick={handleCreateAccount}>Create Account</button>
        </div>
      </div>
    );
  }

  // Logged in - show storage interface
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Pipe Storage</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <p>Logged in as: <strong>{account.username}</strong></p>

      {/* Balance */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Balance</h3>
        {balanceLoading ? (
          <p>Loading...</p>
        ) : balance ? (
          <div>
            <p>SOL: {balance.sol}</p>
            <p>PIPE: {balance.pipe}</p>
            <button onClick={refreshBalance}>Refresh</button>
          </div>
        ) : (
          <p>No balance data</p>
        )}
      </div>

      {/* Upload */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Upload File</h3>
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ marginBottom: '10px' }}
        />
        {uploading && <div>Uploading: {progress}%</div>}
        {uploadError && <div style={{ color: 'red' }}>Error: {uploadError}</div>}
      </div>

      {/* Files */}
      <div>
        <h3>My Files ({files.length})</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {files.map((file) => (
              <li
                key={file.fileId}
                style={{
                  background: '#f5f5f5',
                  padding: '10px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{file.fileName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {file.size} bytes • {new Date(file.uploadedAt).toLocaleString()}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => handleDownload(file.fileId, file.fileName)}
                    disabled={downloading}
                    style={{ marginRight: '10px' }}
                  >
                    Download
                  </button>
                  <button onClick={() => handleDelete(file.fileId)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {downloadError && <div style={{ color: 'red' }}>Download error: {downloadError}</div>}
      </div>
    </div>
  );
}

export default StorageApp;
