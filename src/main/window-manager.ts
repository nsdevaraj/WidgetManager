import { BrowserWindow } from 'electron';
import { WindowPosition, WindowSize } from '../types/window';

export class WindowManager {
  private window: BrowserWindow | null = null;
  private static instance: WindowManager | null = null;

  private constructor() {}

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  setWindow(window: BrowserWindow): void {
    this.window = window;
    
    // Listen for window destruction
    window.on('closed', () => {
      if (this.window === window) {
        this.window = null;
      }
    });

    // Listen for window ready-to-show
    window.on('ready-to-show', () => {
      if (this.window === window && !window.isDestroyed()) {
        window.show();
      }
    });
  }

  private ensureWindow(): BrowserWindow {
    if (!this.window || this.window.isDestroyed()) {
      const windows = BrowserWindow.getAllWindows();
      this.window = windows.find(win => !win.isDestroyed()) || null;
      
      if (!this.window) {
        throw new Error('No valid window available');
      }
    }
    return this.window;
  }

  getPosition(): WindowPosition {
    try {
      const win = this.ensureWindow();
      const [x, y] = win.getPosition();
      return { x, y };
    } catch (error) {
      console.error('Failed to get window position:', error);
      return { x: 0, y: 0 };
    }
  }

  setPosition(x: number, y: number): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        win.setPosition(x, y);
      }
    } catch (error) {
      console.error('Failed to set window position:', error);
    }
  }

  minimize(): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed() && !win.isMinimized()) {
        win.minimize();
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }

  maximize(): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed() && !win.isMaximized()) {
        win.maximize();
      }
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  }

  restore(): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else if (win.isMinimized()) {
          win.restore();
        }
      }
    } catch (error) {
      console.error('Failed to restore window:', error);
    }
  }

  close(): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        win.close();
      }
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }

  getSize(): WindowSize {
    try {
      const win = this.ensureWindow();
      const [width, height] = win.getSize();
      return { width, height };
    } catch (error) {
      console.error('Failed to get window size:', error);
      return { width: 800, height: 600 };
    }
  }

  setSize(size: WindowSize): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        win.setSize(size.width, size.height);
      }
    } catch (error) {
      console.error('Failed to set window size:', error);
    }
  }

  handleDrag(x: number, y: number): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        win.setPosition(x, y);
        // Trigger the move event to update the widget's configuration
        win.emit('move');
      }
    } catch (error) {
      console.error('Failed to handle window drag:', error);
    }
  }

  handleResize(direction: 'bottom' | 'right' | 'bottomRight', x: number, y: number): void {
    try {
      const win = this.ensureWindow();
      if (!win.isDestroyed()) {
        const [width, height] = win.getSize();
        const [windowX, windowY] = win.getPosition();
        const minWidth = win.getBounds().width;
        const minHeight = win.getBounds().height;

        switch (direction) {
          case 'bottom':
            win.setSize(width, Math.max(y - windowY, minHeight));
            break;
          case 'right':
            win.setSize(Math.max(x - windowX, minWidth), height);
            break;
          case 'bottomRight':
            win.setSize(
              Math.max(x - windowX, minWidth),
              Math.max(y - windowY, minHeight)
            );
            break;
        }
      }
    } catch (error) {
      console.error('Failed to handle window resize:', error);
    }
  }

  dispose(): void {
    this.window = null;
    WindowManager.instance = null;
  }
}

export function initializeWindowManagement(window: BrowserWindow) {
  const manager = WindowManager.getInstance();
  manager.setWindow(window);
  return manager;
} 