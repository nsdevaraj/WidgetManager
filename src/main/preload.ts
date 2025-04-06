// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ElectronAPI, UpdateInfo } from '../types/electron';
import { AppSettings, WidgetConfig, WidgetResourceMetrics } from '../types/config';

// Create the API object for widget windows
const api: ElectronAPI = {
  // Settings management
  getSettings: async () => {
    return await ipcRenderer.invoke('settings:get');
  },
  updateSettings: async (settings: Partial<AppSettings>) => {
    return await ipcRenderer.invoke('settings:update', settings);
  },
  resetSettings: async () => {
    return await ipcRenderer.invoke('settings:reset');
  },

  // Update management
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  quitAndInstall: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (callback: (event: IpcRendererEvent, info: UpdateInfo) => void) => {
    ipcRenderer.on('update:available', callback);
    return () => ipcRenderer.removeListener('update:available', callback);
  },
  onUpdateDownloaded: (callback: (event: IpcRendererEvent, info: UpdateInfo) => void) => {
    ipcRenderer.on('update:downloaded', callback);
    return () => ipcRenderer.removeListener('update:downloaded', callback);
  },
  onUpdaterMessage: (callback: (event: IpcRendererEvent, message: any) => void) => {
    ipcRenderer.on('update:message', callback);
    return () => ipcRenderer.removeListener('update:message', callback);
  },

  // Event handling
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  invoke: async (channel: string, ...args: any[]) => {
    return await ipcRenderer.invoke(channel, ...args);
  },

  // Widget management
  listWidgets: () => ipcRenderer.invoke('widget:list'),
  addWidget: (config: Partial<WidgetConfig>) => ipcRenderer.invoke('widget:add', config),
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => ipcRenderer.invoke('widget:update', { id, updates }),
  deleteWidget: (id: string) => ipcRenderer.invoke('widget:delete', id),
  
  // Window management
  onStartDrag: () => ipcRenderer.send('window:start-drag'),
  onMouseMove: (x: number, y: number) => ipcRenderer.send('window:mouse-move', x, y),
  onMouseUp: () => ipcRenderer.send('window:mouse-up'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  restore: () => ipcRenderer.invoke('window:restore'),
  getPosition: () => ipcRenderer.invoke('window:get-position'),
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:set-position', x, y),

  // Screen management
  getScreens: () => ipcRenderer.invoke('screen:get-all'),
  getPrimaryScreen: () => ipcRenderer.invoke('screen:get-primary'),
  getCurrentScreen: () => ipcRenderer.invoke('screen:get-current'),

  // Window drag and resize events
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => {
    ipcRenderer.send('window:start-resize', direction);
  },

  // BrowserView management
  createBrowserView: (id: string, url: string) => {
    ipcRenderer.send('browserView:create', { id, url });
  },
  destroyBrowserView: (id: string) => {
    ipcRenderer.send('browserView:destroy', id);
  },
  setBrowserViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => {
    ipcRenderer.send('browserView:setBounds', { id, bounds });
  },

  // Resource monitoring
  getWidgetMetrics: (widgetId: string) => ipcRenderer.invoke('widget:get-metrics', widgetId),
  onMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => {
    ipcRenderer.on('widget:metrics-update', callback);
  },
  offMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => {
    ipcRenderer.removeListener('widget:metrics-update', callback);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// Initialize widget configuration
(async () => {
  try {
    // Get the widget ID from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const widgetId = urlParams.get('id');
    
    if (!widgetId) {
      throw new Error('Widget ID not provided');
    }

    // Use the widget-specific channel
    const widgetConfig = await ipcRenderer.invoke(`widget:${widgetId}:get-config`);
    
    // Expose the widget config to the renderer process
    contextBridge.exposeInMainWorld('widgetConfig', widgetConfig);
  } catch (error) {
    console.error('Failed to initialize widget configuration:', error);
  }
})();
