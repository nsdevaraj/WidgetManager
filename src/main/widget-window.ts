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
    // Update position if specified
    if (updates.position) {
      this.window.setPosition(updates.position.x, updates.position.y);
    }

    // Update size if specified
    if (updates.size) {
      this.window.setSize(updates.size.width, updates.size.height);
    }

    // Update settings if specified
    if (updates.settings) {
      if (updates.settings.isAlwaysOnTop !== undefined) {
        this.window.setAlwaysOnTop(updates.settings.isAlwaysOnTop);
      }
      if (updates.settings.opacity !== undefined) {
        this.window.setOpacity(updates.settings.opacity);
      }
    }

    // Update the stored config
    this.config = { ...this.config, ...updates };
  }

  public getConfig(): WidgetConfig {
    return this.config;
  }

  public dispose() {
    if (!this.window.isDestroyed()) {
      this.window.close();
    }
  }
} 