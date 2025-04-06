import { screen, ipcMain, Display, BrowserWindow } from 'electron';
import { Screen } from '../types/types';

export class ScreenManager {
  private static instance: ScreenManager | null = null;
  private window: BrowserWindow | null = null;

  private constructor() {
    this.initializeHandlers();
  }

  static getInstance(): ScreenManager {
    if (!ScreenManager.instance) {
      ScreenManager.instance = new ScreenManager();
    }
    return ScreenManager.instance;
  }

  setWindow(window: BrowserWindow) {
    this.window = window;
  }

  private convertDisplay(display: Display): Screen {
    return {
      id: display.id,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
      isPrimary: display.id === screen.getPrimaryDisplay().id
    };
  }

  private initializeHandlers() {
    ipcMain.handle('screen:get-all', () => {
      return screen.getAllDisplays().map(this.convertDisplay);
    });

    ipcMain.handle('screen:get-primary', () => {
      return this.convertDisplay(screen.getPrimaryDisplay());
    });

    ipcMain.handle('screen:get-current', () => {
      const point = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(point);
      return this.convertDisplay(display);
    });

    // Listen for screen changes
    screen.on('display-added', () => {
      this.window?.webContents.send('screen:changed');
    });

    screen.on('display-removed', () => {
      this.window?.webContents.send('screen:changed');
    });

    screen.on('display-metrics-changed', () => {
      this.window?.webContents.send('screen:changed');
    });
  }

  dispose() {
    // Clean up handlers
    ipcMain.removeHandler('screen:get-all');
    ipcMain.removeHandler('screen:get-primary');
    ipcMain.removeHandler('screen:get-current');
    this.window = null;
    ScreenManager.instance = null;
  }
}

export function initializeScreenManagement(window: BrowserWindow) {
  const manager = ScreenManager.getInstance();
  manager.setWindow(window);
  return manager;
} 