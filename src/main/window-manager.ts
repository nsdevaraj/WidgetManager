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
  }

  getPosition(): WindowPosition {
    if (!this.window) return { x: 0, y: 0 };
    const [x, y] = this.window.getPosition();
    return { x, y };
  }

  setPosition(x: number, y: number): void {
    if (!this.window) return;
    this.window.setPosition(x, y);
  }

  minimize(): void {
    if (!this.window) return;
    this.window.minimize();
  }

  maximize(): void {
    if (!this.window) return;
    this.window.maximize();
  }

  restore(): void {
    if (!this.window) return;
    this.window.restore();
  }

  close(): void {
    if (!this.window) return;
    this.window.close();
  }

  getSize(): WindowSize {
    if (!this.window) return { width: 800, height: 600 };
    const [width, height] = this.window.getSize();
    return { width, height };
  }

  setSize(size: WindowSize): void {
    if (!this.window) return;
    this.window.setSize(size.width, size.height);
  }

  handleDrag(x: number, y: number): void {
    if (!this.window) return;
    this.window.setPosition(x, y);
  }

  handleResize(direction: 'bottom' | 'right' | 'bottomRight', x: number, y: number): void {
    if (!this.window) return;
    const [width, height] = this.window.getSize();
    const [windowX, windowY] = this.window.getPosition();

    switch (direction) {
      case 'bottom':
        this.window.setSize(width, y - windowY);
        break;
      case 'right':
        this.window.setSize(x - windowX, height);
        break;
      case 'bottomRight':
        this.window.setSize(x - windowX, y - windowY);
        break;
    }
  }

  dispose(): void {
    this.window = null;
  }
}

export function initializeWindowManagement(window: BrowserWindow) {
  const manager = WindowManager.getInstance();
  manager.setWindow(window);
  return manager;
} 