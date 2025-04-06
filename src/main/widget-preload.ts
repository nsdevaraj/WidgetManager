import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../types/electron';

// Create the API object for widget windows
const api: IElectronAPI = {
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

  // Screen management
  getScreens: () => ipcRenderer.invoke('screen:get-all'),
  getPrimaryScreen: () => ipcRenderer.invoke('screen:get-primary'),
  getCurrentScreen: () => ipcRenderer.invoke('screen:get-current'),
  getPosition: () => ipcRenderer.invoke('window:get-position'),
  setPosition: (x, y) => ipcRenderer.invoke('window:set-position', x, y),
  restore: () => ipcRenderer.invoke('window:restore'),

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
    const widgetConfig = await ipcRenderer.invoke('widget:get-config');
    
    // Expose the API and widget config to the renderer process
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('widgetConfig', widgetConfig);
  } catch (error) {
    console.error('Failed to initialize widget configuration:', error);
  }
})(); 