import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../types/electron';

// Create the API object for widget windows
const api: Partial<IElectronAPI> = {
  // Window drag events
  onStartDrag: () => ipcRenderer.send('window:start-drag'),
  onMouseMove: (x: number, y: number) => 
    ipcRenderer.send('window:mouse-move', { x, y }),
  onMouseUp: () => ipcRenderer.send('window:mouse-up'),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api); 