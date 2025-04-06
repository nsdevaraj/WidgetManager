// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { WidgetConfig } from '../types/config';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Widget operations
    addWidget: (widget: Omit<WidgetConfig, 'id'>) => 
      ipcRenderer.invoke('widget:add', widget),
    
    removeWidget: (id: string) => 
      ipcRenderer.invoke('widget:remove', id),
    
    updateWidget: (id: string, updates: Partial<WidgetConfig>) =>
      ipcRenderer.invoke('widget:update', { id, updates }),
    
    listWidgets: () => 
      ipcRenderer.invoke('widget:list'),

    // Settings operations
    getSettings: () => 
      ipcRenderer.invoke('settings:get'),
    
    updateSettings: (updates: any) => 
      ipcRenderer.invoke('settings:update', updates),

    // Window control functions
    minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
    maximizeWindow: () => ipcRenderer.send('window-control', 'maximize'),
    closeWindow: () => ipcRenderer.send('window-control', 'close'),

    // Add any other APIs you want to expose to the renderer process here
    // Example: send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    // Example: receive: (channel: string, func: Function) => ipcRenderer.on(channel, func),
  }
);
