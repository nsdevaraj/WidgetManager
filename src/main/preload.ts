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
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),

    // Window position and size management
    getWindowPosition: () => ipcRenderer.invoke('window:get-position'),
    setWindowPosition: (position: { x: number; y: number }) => 
      ipcRenderer.send('window:set-position', position),
    getWindowSize: () => ipcRenderer.invoke('window:get-size'),
    setWindowSize: (size: { width: number; height: number }) => 
      ipcRenderer.send('window:set-size', size),
    
    // Window drag and resize
    startWindowDrag: () => {
      ipcRenderer.send('window:start-drag');
      
      const mouseMoveHandler = (e: MouseEvent) => {
        ipcRenderer.send('window:mouse-move', { x: e.screenX, y: e.screenY });
      };
      
      const mouseUpHandler = () => {
        ipcRenderer.send('window:mouse-up');
        window.removeEventListener('mousemove', mouseMoveHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
      };
      
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', mouseUpHandler);
    },
    
    startWindowResize: (direction: 'bottom' | 'right' | 'bottomRight') => {
      ipcRenderer.send('window:start-resize', direction);
      
      const mouseMoveHandler = (e: MouseEvent) => {
        ipcRenderer.send('window:mouse-move', { x: e.screenX, y: e.screenY });
      };
      
      const mouseUpHandler = () => {
        ipcRenderer.send('window:mouse-up');
        window.removeEventListener('mousemove', mouseMoveHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
      };
      
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', mouseUpHandler);
    },

    // Add any other APIs you want to expose to the renderer process here
    // Example: send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    // Example: receive: (channel: string, func: Function) => ipcRenderer.on(channel, func),
  }
);
