import { BrowserWindow, ipcMain, BrowserView } from 'electron';
import { WidgetConfig } from '../types/config';

declare const WIDGET_WINDOW_WEBPACK_ENTRY: string;
declare const WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class WidgetWindow {
  private window: BrowserWindow;
  private config: WidgetConfig;
  private browserView: BrowserView | null = null;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.window = this.createWindow();
    this.setupWindow();
    this.setupIPC();
  }

  private createWindow(): BrowserWindow {
    return new BrowserWindow({
      width: this.config.size.width,
      height: this.config.size.height,
      x: this.config.position.x,
      y: this.config.position.y,
      frame: false,
      transparent: true,
      alwaysOnTop: this.config.settings?.isAlwaysOnTop ?? false,
      skipTaskbar: true,
      movable: true,
      resizable: true,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        preload: WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY,
        // Allow iframes to load content
        webgl: true,
        images: true,
        javascript: true,
      },
    });
  }

  private setupWindow() {
    // Load the widget's URL
    this.window.loadURL(WIDGET_WINDOW_WEBPACK_ENTRY).catch(err => {
      console.error('Failed to load widget window:', err);
    });

    // Set opacity if specified
    if (this.config.settings?.opacity !== undefined) {
      this.window.setOpacity(this.config.settings.opacity);
    }

    // Handle window ready-to-show
    this.window.once('ready-to-show', () => {
      this.window.show();
    });

    // Handle window close
    this.window.on('closed', () => {
      this.dispose();
    });

    // Handle window move events
    this.window.on('move', () => {
      const [x, y] = this.window.getPosition();
      this.updateConfig({
        position: { x, y }
      });
    });

    // Handle window resize events
    this.window.on('resize', () => {
      const [width, height] = this.window.getSize();
      this.updateConfig({
        size: { width, height }
      });

      // Update BrowserView size if it exists
      if (this.browserView) {
        const bounds = this.window.getBounds();
        // Account for the header height (36px)
        this.browserView.setBounds({
          x: 0,
          y: 36,
          width: bounds.width,
          height: bounds.height - 36
        });
      }
    });
  }

  private setupIPC() {
    // Handle widget:get-config request
    ipcMain.handle('widget:get-config', () => {
      return this.config;
    });

    // Clean up IPC handlers when window is closed
    this.window.on('closed', () => {
      ipcMain.removeHandler('widget:get-config');
    });

    // Handle BrowserView creation
    ipcMain.on('browserView:create', (_, { id, url }) => {
      if (this.config.id === id) {
        this.createBrowserView(url);
      }
    });

    // Handle BrowserView bounds update
    ipcMain.on('browserView:setBounds', (_, { id, bounds }) => {
      if (this.config.id === id && this.browserView) {
        this.browserView.setBounds(bounds);
      }
    });

    // Handle BrowserView destruction
    ipcMain.on('browserView:destroy', (_, id) => {
      if (this.config.id === id) {
        this.destroyBrowserView();
      }
    });
  }

  private createBrowserView(url: string) {
    // Destroy existing BrowserView if any
    this.destroyBrowserView();

    // Create new BrowserView
    this.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Add to window and load URL
    this.window.addBrowserView(this.browserView);
    
    // Set initial bounds
    const bounds = this.window.getBounds();
    this.browserView.setBounds({
      x: 0,
      y: 36, // Account for header height
      width: bounds.width,
      height: bounds.height - 36
    });

    // Load the URL
    this.browserView.webContents.loadURL(url).catch(err => {
      console.error('Failed to load URL in BrowserView:', err);
    });
  }

  private destroyBrowserView() {
    if (this.browserView) {
      this.window.removeBrowserView(this.browserView);
      this.browserView = null;
    }
  }

  public updateConfig(updates: Partial<WidgetConfig>) {
    try {
      // Update window properties
      if (updates.position) {
        this.window.setPosition(
          Math.round(updates.position.x),
          Math.round(updates.position.y)
        );
      }

      if (updates.size) {
        this.window.setSize(
          Math.round(updates.size.width),
          Math.round(updates.size.height)
        );
      }

      if (updates.settings?.isAlwaysOnTop !== undefined) {
        this.window.setAlwaysOnTop(updates.settings.isAlwaysOnTop);
      }

      if (updates.settings?.opacity !== undefined) {
        this.window.setOpacity(updates.settings.opacity);
      }

      // Update the stored config
      this.config = {
        ...this.config,
        ...updates,
        position: updates.position ? {
          x: Number(updates.position.x),
          y: Number(updates.position.y)
        } : this.config.position,
        size: updates.size ? {
          width: Number(updates.size.width),
          height: Number(updates.size.height)
        } : this.config.size,
        settings: {
          ...this.config.settings,
          ...updates.settings
        }
      };

      // Update BrowserView URL if changed
      if (updates.settings?.initialUrl && this.browserView) {
        this.browserView.webContents.loadURL(updates.settings.initialUrl).catch(err => {
          console.error('Failed to update BrowserView URL:', err);
        });
      }
    } catch (error) {
      console.error('Error updating widget config:', error);
      throw error;
    }
  }

  public getConfig(): WidgetConfig {
    return this.config;
  }

  public dispose(): void {
    this.destroyBrowserView();
    try {
      if (!this.window.isDestroyed()) {
        this.window.destroy();
      }
    } catch (error) {
      console.error('Error disposing widget window:', error);
    }
  }
} 