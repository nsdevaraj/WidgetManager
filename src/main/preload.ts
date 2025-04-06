// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings } from '../types/config';
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
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
  invoke: async (channel: string, ...args: any[]) => {
    return await ipcRenderer.invoke(channel, ...args);
  },

  // Widget management
  listWidgets: async () => {
    return await ipcRenderer.invoke('widget:list');
  },
  addWidget: async (config) => {
    return await ipcRenderer.invoke('widget:add', config);
  },
  updateWidget: async (id, updates) => {
    return await ipcRenderer.invoke('widget:update', { id, updates });
  },
  deleteWidget: async (id) => {
    return await ipcRenderer.invoke('widget:delete', id);
  },

  // Screen management
  getScreens: async () => {
    return await ipcRenderer.invoke('screen:get-all');
  },
  getPrimaryScreen: async () => {
    return await ipcRenderer.invoke('screen:get-primary');
  },
  getCurrentScreen: async () => {
    return await ipcRenderer.invoke('screen:get-current');
  },

  // Window management
  getPosition: async () => {
    return await ipcRenderer.invoke('window:get-position');
  },
  setPosition: async (x: number, y: number) => {
    return await ipcRenderer.invoke('window:set-position', x, y);
  },
  minimize: async () => {
    return await ipcRenderer.invoke('window:minimize');
  },
  maximize: async () => {
    return await ipcRenderer.invoke('window:maximize');
  },
  restore: async () => {
    return await ipcRenderer.invoke('window:restore');
  },
  close: async () => {
    return await ipcRenderer.invoke('window:close');
  },

  // Window drag and resize events
  onStartDrag: () => {
    ipcRenderer.send('window:start-drag');
  },
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => {
    ipcRenderer.send('window:start-resize', direction);
  },
  onMouseMove: (x: number, y: number) => {
    ipcRenderer.send('window:mouse-move', { x, y });
  },
  onMouseUp: () => {
    ipcRenderer.send('window:mouse-up');
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
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);
