// React Example - Using SDK with React hooks

import { useState } from 'react';
import { PipeClient, PipeFileStorage, PipeAccount } from 'firestarter-sdk';

export function FileUploader() {
  const [client] = useState(() => new PipeClient());
  const [storage] = useState(() => new PipeFileStorage());
  const [account, setAccount] = useState<PipeAccount | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    const acc = await client.login(username, password);
    setAccount(acc);
  };

  const handleUpload = async (file: File) => {
    if (!account) return;
    
    setUploading(true);
    try {
      const result = await client.uploadFile(account, file, file.name, {
        onProgress: (percent) => console.log(`${percent}%`)
      });
      
      storage.addFile(result);
      alert(`Uploaded: ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    if (!account) return;
    
    const data = await client.downloadFile(account, fileName);
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <div>
      {!account ? (
        <button onClick={() => handleLogin('user', 'pass')}>Login</button>
      ) : (
        <>
          <input type="file" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
          {uploading && <p>Uploading...</p>}
          
          <h3>Files:</h3>
          {storage.listFiles().map(file => (
            <div key={file.fileId}>
              {file.fileName}
              <button onClick={() => handleDownload(file.fileName)}>Download</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
