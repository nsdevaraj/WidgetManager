import React, { useEffect, useState } from 'react';
import { UpdateInfo } from '../types/electron';

declare global {
  interface Window {
    electron: {
      checkForUpdates: () => Promise<void>;
      downloadUpdate: () => Promise<void>;
      quitAndInstall: () => Promise<void>;
      onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
      onUpdateDownloaded: (callback: (event: any, info: any) => void) => void;
      onUpdaterMessage: (callback: (event: any, message: any) => void) => void;
    };
  }
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Check for updates periodically
    const checkInterval = setInterval(() => {
      window.electron.checkForUpdates();
    }, 1000 * 60 * 60); // Check every hour

    // Initial check
    window.electron.checkForUpdates();

    // Listen for update events
    window.electron.onUpdateAvailable((event, info: UpdateInfo) => {
      setUpdateAvailable(true);
      setUpdateMessage(`Update available: version ${info.version}`);
    });

    window.electron.onUpdateDownloaded((event, info: UpdateInfo) => {
      setUpdateDownloaded(true);
      setDownloading(false);
      setUpdateMessage(`Update downloaded: version ${info.version}`);
    });

    window.electron.onUpdaterMessage((event, { message }) => {
      setUpdateMessage(message);
    });

    return () => clearInterval(checkInterval);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    await window.electron.downloadUpdate();
  };

  const handleInstall = async () => {
    await window.electron.quitAndInstall();
  };

  if (!updateAvailable && !updateDownloaded) return null;

  return (
    <div className="update-notification">
      <p>{updateMessage}</p>
      {updateAvailable && !updateDownloaded && (
        <button 
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'Download Update'}
        </button>
      )}
      {updateDownloaded && (
        <button onClick={handleInstall}>
          Install and Restart
        </button>
      )}
    </div>
  );
}; 