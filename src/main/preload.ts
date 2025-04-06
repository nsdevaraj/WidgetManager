// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../types/window';

// Create the API object
const api = {
  // Widget management
  listWidgets: () => ipcRenderer.invoke('widget:list'),
  addWidget: (config: any) => ipcRenderer.invoke('widget:add', config),
  updateWidget: (id: string, updates: any) => ipcRenderer.invoke('widget:update', { id, updates }),
  deleteWidget: (id: string) => ipcRenderer.invoke('widget:delete', id),
  
  // Screen management
  getScreens: () => ipcRenderer.invoke('screen:get-all'),
  getPrimaryScreen: () => ipcRenderer.invoke('screen:get-primary'),
  getCurrentScreen: () => ipcRenderer.invoke('screen:get-current'),
  
  // Window management
  getPosition: () => ipcRenderer.invoke('window:get-position'),
  setPosition: (x: number, y: number) => ipcRenderer.invoke('window:set-position', x, y),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  restore: () => ipcRenderer.invoke('window:restore'),
  close: () => ipcRenderer.invoke('window:close'),

  // Settings management
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (updates: any) => ipcRenderer.invoke('settings:update', updates),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),

  // Window drag and resize events
  onStartDrag: () => ipcRenderer.send('window:start-drag'),
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => 
    ipcRenderer.send('window:start-resize', direction),
  onMouseMove: (x: number, y: number) => 
    ipcRenderer.send('window:mouse-move', { x, y }),
  onMouseUp: () => ipcRenderer.send('window:mouse-up')
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);
