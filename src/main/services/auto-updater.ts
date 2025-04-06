import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Configure auto updater options
autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = false;

export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;

  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.initialize();
  }

  private initialize() {
    // Check for updates when app starts
    this.checkForUpdates();

    // Set up auto updater events
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('Update available.', info);
      // Prompt user to download
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-available', info);
      }
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('Update not available.', info);
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('Error in auto-updater.', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow(
        `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
      );
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('Update downloaded', info);
      // Prompt user to install
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded', info);
      }
    });
  }

  private sendStatusToWindow(message: string, data?: any) {
    log.info(message, data);
    if (this.mainWindow) {
      this.mainWindow.webContents.send('updater-message', { message, data });
    }
  }

  // Public methods that can be called from the main process
  public async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Error checking for updates:', error);
    }
  }

  public async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
    }
  }

  public quitAndInstall() {
    autoUpdater.quitAndInstall();
  }
}

// Export a function to create the service
export function createAutoUpdaterService(window: BrowserWindow) {
  return new AutoUpdaterService(window);
} 