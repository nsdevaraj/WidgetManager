// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import type { WidgetConfig } from './store';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
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
});
