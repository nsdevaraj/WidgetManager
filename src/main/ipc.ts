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
  ipcMain.handle('window:get-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    return windowManager.getPosition();
  });

  ipcMain.handle('window:set-position', (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    windowManager.setPosition(x, y);
  });

  ipcMain.handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    windowManager.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    windowManager.maximize();
  });

  ipcMain.handle('window:restore', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    windowManager.restore();
  });

  ipcMain.handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);
    windowManager.close();
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
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) windowManager.setWindow(win);

    if (isDragging) {
      windowManager.handleDrag(x, y);
    } else if (isResizing) {
      windowManager.handleResize(resizeDirection, x, y);
    }
  });

  ipcMain.on('window:mouse-up', () => {
    isDragging = false;
    isResizing = false;
  });
} 