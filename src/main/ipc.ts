import { ipcMain, BrowserWindow } from 'electron';
import { WidgetManager } from './widget-manager';
import { SettingsManager } from './settings-manager';
import { WindowManager } from './window-manager';

let isDragging = false;
let isResizing = false;
let resizeDirection: 'bottom' | 'right' | 'bottomRight' = 'bottomRight';

export function initializeIpcHandlers() {
  const widgetManager = WidgetManager.getInstance();
  const settingsManager = SettingsManager.getInstance();
  const windowManager = WindowManager.getInstance();

  // Widget operations
  ipcMain.handle('widget:add', async (_, widget) => {
    return widgetManager.addWidget(widget);
  });

  ipcMain.handle('widget:remove', async (_, id) => {
    return widgetManager.removeWidget(id);
  });

  ipcMain.handle('widget:update', async (_, { id, updates }) => {
    return widgetManager.updateWidget(id, updates);
  });

  ipcMain.handle('widget:list', async () => {
    return widgetManager.listWidgets();
  });

  // Settings operations
  ipcMain.handle('settings:get', async () => {
    return settingsManager.getSettings();
  });

  ipcMain.handle('settings:update', async (_, updates) => {
    return settingsManager.updateSettings(updates);
  });

  ipcMain.handle('settings:reset', async () => {
    return settingsManager.resetSettings();
  });

  // Window operations
  ipcMain.handle('window:get-position', async (event) => {
    try {
      return windowManager.getPosition();
    } catch (error) {
      console.error('Failed to get window position:', error);
      return { x: 0, y: 0 };
    }
  });

  ipcMain.handle('window:set-position', async (event, x: number, y: number) => {
    try {
      windowManager.setPosition(x, y);
    } catch (error) {
      console.error('Failed to set window position:', error);
    }
  });

  ipcMain.handle('window:minimize', async (event) => {
    try {
      windowManager.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  });

  ipcMain.handle('window:maximize', async (event) => {
    try {
      windowManager.maximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  });

  ipcMain.handle('window:restore', async (event) => {
    try {
      windowManager.restore();
    } catch (error) {
      console.error('Failed to restore window:', error);
    }
  });

  ipcMain.handle('window:close', async (event) => {
    try {
      windowManager.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  });

  // Window drag and resize events
  ipcMain.on('window:start-drag', () => {
    isDragging = true;
  });

  ipcMain.on('window:start-resize', (_, direction: 'bottom' | 'right' | 'bottomRight') => {
    isResizing = true;
    resizeDirection = direction;
  });

  ipcMain.on('window:mouse-move', (event, { x, y }) => {
    try {
      if (isDragging) {
        windowManager.handleDrag(x, y);
      } else if (isResizing) {
        windowManager.handleResize(resizeDirection, x, y);
      }
    } catch (error) {
      console.error('Failed to handle window movement:', error);
    }
  });

  ipcMain.on('window:mouse-up', () => {
    isDragging = false;
    isResizing = false;
  });
} 