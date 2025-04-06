import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): BrowserWindow => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame: false, // Make window frameless
    transparent: true, // Enable transparency for custom chrome
    webPreferences: {
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Enable context isolation
      sandbox: true, // Enable sandboxing
      webviewTag: false, // Disable webview tag for security
      preload: path.join(__dirname, 'preload.js'), // Add preload script
    },
    // Set minimum dimensions
    minWidth: 400,
    minHeight: 300,
    // Enable window to be shown only when ready
    show: false,
  });

  // Handle window control events
  ipcMain.on('window-control', (_, command) => {
    switch (command) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  // Handle window loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
    // TODO: Show error UI to user
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app's entry point
  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).catch(err => {
      console.error('Failed to load app:', err);
      // TODO: Show error UI to user
    });
  }

  // Disable DevTools in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 