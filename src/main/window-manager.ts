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
  }

  private ensureWindow(): BrowserWindow {
    if (!this.window || this.window.isDestroyed()) {
      // Get the focused window or the first window
      this.window = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      if (!this.window || this.window.isDestroyed()) {
        throw new Error('No valid window available');
      }
    }
    return this.window;
  }

  getPosition(): WindowPosition {
    const win = this.ensureWindow();
    const [x, y] = win.getPosition();
    return { x, y };
  }

  setPosition(x: number, y: number): void {
    const win = this.ensureWindow();
    win.setPosition(x, y);
  }

  minimize(): void {
    const win = this.ensureWindow();
    win.minimize();
  }

  maximize(): void {
    const win = this.ensureWindow();
    win.maximize();
  }

  restore(): void {
    const win = this.ensureWindow();
    win.restore();
  }

  close(): void {
    const win = this.ensureWindow();
    win.close();
  }

  getSize(): WindowSize {
    const win = this.ensureWindow();
    const [width, height] = win.getSize();
    return { width, height };
  }

  setSize(size: WindowSize): void {
    const win = this.ensureWindow();
    win.setSize(size.width, size.height);
  }

  handleDrag(x: number, y: number): void {
    const win = this.ensureWindow();
    win.setPosition(x, y);
  }

  handleResize(direction: 'bottom' | 'right' | 'bottomRight', x: number, y: number): void {
    const win = this.ensureWindow();
    const [width, height] = win.getSize();
    const [windowX, windowY] = win.getPosition();

    switch (direction) {
      case 'bottom':
        win.setSize(width, y - windowY);
        break;
      case 'right':
        win.setSize(x - windowX, height);
        break;
      case 'bottomRight':
        win.setSize(x - windowX, y - windowY);
        break;
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