/**
 * Simple React hooks for Firestarter SDK
 *
 * These hooks are OPTIONAL and provide basic React integration.
 * No magic - just simple wrappers around PipeClient methods.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PipeClient } from '../client.js';
import type { PipeAccount, FileRecord, UploadResult, Balance } from '../types.js';

/**
 * Hook to use a PipeClient with an account
 *
 * Returns convenient methods for common operations.
 * Developer must provide the account explicitly.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [account, setAccount] = useState<PipeAccount | null>(null);
 *   const pipe = usePipeClient(account);
 *
 *   const handleLogin = async () => {
 *     const acc = await pipe.client.login(username, password);
 *     setAccount(acc);
 *   };
 *
 *   const handleUpload = async (file: File) => {
 *     if (!account) return;
 *     await pipe.uploadFile(file, 'myfile.txt');
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePipeClient(account: PipeAccount | null, client?: PipeClient) {
  const [pipeClient] = useState(() => client || new PipeClient());

  const uploadFile = useCallback(
    async (
      file: File | Buffer | Uint8Array,
      fileName: string,
      onProgress?: (progress: number) => void
    ): Promise<UploadResult | null> => {
      if (!account) {
        throw new Error('No account provided');
      }
      return pipeClient.uploadFile(account, file, fileName, { onProgress });
    },
    [account, pipeClient]
  );

  const downloadFile = useCallback(
    async (fileId: string): Promise<Uint8Array | null> => {
      if (!account) {
        throw new Error('No account provided');
      }
      return pipeClient.downloadFile(account, fileId);
    },
    [account, pipeClient]
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!account) {
        throw new Error('No account provided');
      }
      return pipeClient.deleteFile(account, fileId);
    },
    [account, pipeClient]
  );

  const getBalance = useCallback(async (): Promise<Balance | null> => {
    if (!account) {
      return null;
    }
    return pipeClient.getBalance(account);
  }, [account, pipeClient]);

  const exchangeSolForPipe = useCallback(
    async (solAmount: number): Promise<number> => {
      if (!account) {
        throw new Error('No account provided');
      }
      return pipeClient.exchangeSolForPipe(account, solAmount);
    },
    [account, pipeClient]
  );

  return {
    client: pipeClient,
    uploadFile,
    downloadFile,
    deleteFile,
    getBalance,
    exchangeSolForPipe,
  };
}

/**
 * Hook to manage file uploads with progress tracking
 *
 * @example
 * ```tsx
 * function UploadButton({ account }: { account: PipeAccount }) {
 *   const { upload, uploading, progress, error } = useFileUpload(account);
 *
 *   const handleUpload = async (file: File) => {
 *     const result = await upload(file, file.name);
 *     if (result) {
 *       console.log('Uploaded:', result.fileId);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => handleUpload(e.target.files[0])} disabled={uploading} />
 *       {uploading && <div>Uploading: {progress}%</div>}
 *       {error && <div>Error: {error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFileUpload(account: PipeAccount | null, client?: PipeClient) {
  const [pipeClient] = useState(() => client || new PipeClient());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File | Buffer | Uint8Array,
      fileName: string
    ): Promise<UploadResult | null> => {
      if (!account) {
        setError('No account provided');
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const result = await pipeClient.uploadFile(account, file, fileName, {
          onProgress: setProgress,
        });
        setProgress(100);
        return result;
      } catch (err: any) {
        setError(err.message || 'Upload failed');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [account, pipeClient]
  );

  return { upload, uploading, progress, error };
}

/**
 * Hook to fetch and manage balance
 *
 * @example
 * ```tsx
 * function BalanceDisplay({ account }: { account: PipeAccount }) {
 *   const { balance, loading, error, refresh } = useBalance(account);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!balance) return null;
 *
 *   return (
 *     <div>
 *       <div>SOL: {balance.sol}</div>
 *       <div>PIPE: {balance.pipe}</div>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBalance(account: PipeAccount | null, client?: PipeClient) {
  const [pipeClient] = useState(() => client || new PipeClient());
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!account) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bal = await pipeClient.getBalance(account);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [account, pipeClient]);

  // Auto-fetch on account change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refresh: fetchBalance };
}

/**
 * Hook to manage file download
 *
 * @example
 * ```tsx
 * function FileDownload({ account, fileId }: { account: PipeAccount; fileId: string }) {
 *   const { download, downloading, error } = useFileDownload(account);
 *
 *   const handleDownload = async () => {
 *     const data = await download(fileId);
 *     if (data) {
 *       // Create blob and download
 *       const blob = new Blob([data]);
 *       const url = URL.createObjectURL(blob);
 *       const a = document.createElement('a');
 *       a.href = url;
 *       a.download = 'file';
 *       a.click();
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleDownload} disabled={downloading}>
 *       {downloading ? 'Downloading...' : 'Download'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useFileDownload(account: PipeAccount | null, client?: PipeClient) {
  const [pipeClient] = useState(() => client || new PipeClient());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (fileId: string): Promise<Uint8Array | null> => {
      if (!account) {
        setError('No account provided');
        return null;
      }

      setDownloading(true);
      setError(null);

      try {
        const data = await pipeClient.downloadFile(account, fileId);
        return data;
      } catch (err: any) {
        setError(err.message || 'Download failed');
        return null;
      } finally {
        setDownloading(false);
      }
    },
    [account, pipeClient]
  );

  return { download, downloading, error };
}

/**
 * Hook to manage tracked files (using PipeFileStorage)
 *
 * This requires PipeFileStorage to be used for tracking uploads.
 *
 * @example
 * ```tsx
 * function FileList({ files }: { files: FileRecord[] }) {
 *   return (
 *     <ul>
 *       {files.map((file) => (
 *         <li key={file.fileId}>
 *           {file.fileName} - {file.size} bytes
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useTrackedFiles(files: FileRecord[]) {
  const [trackedFiles, setTrackedFiles] = useState<FileRecord[]>(files);

  useEffect(() => {
    setTrackedFiles(files);
  }, [files]);

  const addFile = useCallback((file: FileRecord) => {
    setTrackedFiles((prev) => [file, ...prev]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setTrackedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  }, []);

  return { files: trackedFiles, addFile, removeFile };
}
