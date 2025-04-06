import { BrowserWindow } from 'electron';
import { WidgetConfig } from '../types/config';

declare const WIDGET_WINDOW_WEBPACK_ENTRY: string;
declare const WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export class WidgetWindow {
  private window: BrowserWindow;
  private config: WidgetConfig;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.window = this.createWindow();
    this.setupWindow();
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
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false,
        preload: WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY,
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
  }

  public updateConfig(updates: Partial<WidgetConfig>) {
    try {
      // Update position if specified
      if (updates.position) {
        const x = Number(updates.position.x);
        const y = Number(updates.position.y);
        if (isNaN(x) || isNaN(y)) {
          throw new Error('Invalid position values');
        }
        this.window.setPosition(x, y);
      }

      // Update size if specified
      if (updates.size) {
        const width = Number(updates.size.width);
        const height = Number(updates.size.height);
        if (isNaN(width) || isNaN(height) || width < 50 || height < 50) {
          throw new Error('Invalid size values');
        }
        this.window.setSize(width, height);
      }

      // Update settings if specified
      if (updates.settings) {
        if (updates.settings.isAlwaysOnTop !== undefined) {
          this.window.setAlwaysOnTop(Boolean(updates.settings.isAlwaysOnTop));
        }
        if (updates.settings.opacity !== undefined) {
          const opacity = Number(updates.settings.opacity);
          if (isNaN(opacity) || opacity < 0.1 || opacity > 1) {
            throw new Error('Invalid opacity value');
          }
          this.window.setOpacity(opacity);
        }
      }

      // Update the stored config with validated values
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
          ...updates.settings,
          isAlwaysOnTop: updates.settings?.isAlwaysOnTop !== undefined ? 
            Boolean(updates.settings.isAlwaysOnTop) : 
            this.config.settings?.isAlwaysOnTop,
          opacity: updates.settings?.opacity !== undefined ? 
            Number(updates.settings.opacity) : 
            this.config.settings?.opacity
        }
      };
    } catch (error) {
      console.error('Error updating widget config:', error);
      throw error;
    }
  }

  public getConfig(): WidgetConfig {
    return this.config;
  }

  public dispose(): void {
    try {
      if (!this.window.isDestroyed()) {
        this.window.destroy();
      }
    } catch (error) {
      console.error('Error disposing widget window:', error);
    }
  }
} 