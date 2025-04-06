// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { AppSettings, WidgetResourceMetrics } from '../types/config';
import { IElectronAPI } from '../types/electron';

// Create the API object that matches the IElectronAPI interface exactly
const api: IElectronAPI = {
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

  // Event handling
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.off(channel, callback);
  },
  invoke: async (channel: string, ...args: any[]) => {
    return await ipcRenderer.invoke(channel, ...args);
  },

  // Widget management
  listWidgets: () => ipcRenderer.invoke('widget:list'),
  addWidget: (config) => ipcRenderer.invoke('widget:add', config),
  updateWidget: (id, updates) => ipcRenderer.invoke('widget:update', { id, updates }),
  deleteWidget: (id) => ipcRenderer.invoke('widget:delete', id),
  
  // Window management
  onStartDrag: () => ipcRenderer.send('window:start-drag'),
  onMouseMove: (x: number, y: number) => ipcRenderer.send('window:mouse-move', { x, y }),
  onMouseUp: () => ipcRenderer.send('window:mouse-up'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  restore: () => ipcRenderer.invoke('window:restore'),
  getPosition: () => ipcRenderer.invoke('window:get-position'),
  setPosition: (x, y) => ipcRenderer.invoke('window:set-position', x, y),

  // Screen management
  getScreens: () => ipcRenderer.invoke('screen:get-all'),
  getPrimaryScreen: () => ipcRenderer.invoke('screen:get-primary'),
  getCurrentScreen: () => ipcRenderer.invoke('screen:get-current'),

  // Window drag and resize events
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => {
    ipcRenderer.send('window:start-resize', direction);
  },

  // BrowserView management
  createBrowserView: (id: string, url: string) => 
    ipcRenderer.send('browserView:create', { id, url }),
  destroyBrowserView: (id: string) => 
    ipcRenderer.send('browserView:destroy', id),
  setBrowserViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => 
    ipcRenderer.send('browserView:setBounds', { id, bounds }),

  // Resource monitoring
  getWidgetMetrics: async (widgetId: string): Promise<WidgetResourceMetrics | null> => {
    return await ipcRenderer.invoke(`widget:${widgetId}:get-metrics`);
  },
  onMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => {
    ipcRenderer.on('widget:metrics-update', callback);
  },
  offMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => {
    ipcRenderer.removeListener('widget:metrics-update', callback);
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', api);

contextBridge.exposeInMainWorld(
  'electron',
  {
    // ... existing exposed methods ...
    
    // Auto-updater methods
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    
    // Auto-updater events
    onUpdateAvailable: (callback: (event: any, info: any) => void) => {
      ipcRenderer.on('update-available', callback);
    },
    onUpdateDownloaded: (callback: (event: any, info: any) => void) => {
      ipcRenderer.on('update-downloaded', callback);
    },
    onUpdaterMessage: (callback: (event: any, message: any) => void) => {
      ipcRenderer.on('updater-message', callback);
    }
  }
);
