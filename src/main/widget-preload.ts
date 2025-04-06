import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../types/electron';
import { AppSettings } from '../types/config';

// Create the API object for widget windows
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
    ipcRenderer.send('browserView:setBounds', { id, bounds })
};

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
    
    // Expose the API and widget config to the renderer process
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('widgetConfig', widgetConfig);
  } catch (error) {
    console.error('Failed to initialize widget configuration:', error);
  }
})(); 