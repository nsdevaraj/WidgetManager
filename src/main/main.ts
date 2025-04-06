import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { WindowManager, initializeWindowManagement } from './window-manager';
import { ScreenManager, initializeScreenManagement } from './screen-manager';
import { WidgetManager, initializeWidgetManagement } from './widget-manager';
import { SettingsManager, initializeSettingsManagement } from './settings-manager';
import { initializeIpcHandlers } from './ipc';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const WIDGET_WINDOW_WEBPACK_ENTRY: string;
declare const WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize managers at the application level
let widgetManager: WidgetManager | null = null;
let settingsManager: SettingsManager | null = null;

// Track if IPC handlers have been initialized
let ipcHandlersInitialized = false;

export const createWindow = (): BrowserWindow => {
  // Set up Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          // Allow scripts from our origin and inline scripts (needed for webpack)
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          // Allow styles from our origin and inline styles
          "style-src 'self' 'unsafe-inline'",
          // Allow images from our origin and data URLs
          "img-src 'self' data: https:",
          // Allow fonts from our origin and data URLs
          "font-src 'self' data:",
          // Allow connections to our origin and websocket (needed for hot reload)
          "connect-src 'self' ws: localhost:* http://localhost:*",
          // Prevent all object/embed/media content
          "object-src 'none'",
          "media-src 'none'",
          // Frame restrictions
          "frame-src 'none'",
          "child-src 'none'"
        ].join('; ')
      }
    });
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    frame: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      // Additional security settings
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
    // Set minimum dimensions
    minWidth: 400,
    minHeight: 300,
    // Enable window to be shown only when ready
    show: false,
    // Add window styling
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden', // Hide title bar but keep window controls
  });

  // Initialize window-specific managers
  initializeWindowManagement(mainWindow);
  initializeScreenManagement(mainWindow);

  // Handle window loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
    // Retry loading after a short delay
    setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).catch(err => {
          console.error('Failed to reload app:', err);
        });
      }
    }, 1000);
  });

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app's entry point
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).catch(err => {
    console.error('Failed to load app:', err);
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
};

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try {
    // Initialize managers
    widgetManager = await initializeWidgetManagement();
    settingsManager = await initializeSettingsManagement();

    // Initialize IPC handlers after managers are ready
    if (!ipcHandlersInitialized) {
      initializeIpcHandlers();
      ipcHandlersInitialized = true;
    }

    createWindow();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Clean up application-level managers when quitting
app.on('before-quit', () => {
  if (widgetManager) {
    widgetManager.dispose();
    widgetManager = null;
  }
  if (settingsManager) {
    settingsManager.dispose();
    settingsManager = null;
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 