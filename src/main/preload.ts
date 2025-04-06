// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings } from '../types/config';

// Create a strongly typed API
interface ElectronAPI {
  invoke(channel: 'settings:get'): Promise<AppSettings>;
  invoke(channel: 'settings:update', settings: AppSettings): Promise<void>;
  invoke(channel: string, ...args: any[]): Promise<unknown>;
}

// Declare the API on the window object
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    invoke: async (channel: string, ...args: any[]) => {
      // List of valid channels that can be called from the renderer
      const validChannels = [
        'settings:get',
        'settings:update',
        'settings:reset',
        'window:get-position',
        'window:set-position',
        'window:minimize',
        'window:maximize',
        'window:restore',
        'window:close',
        'widget:add',
        'widget:delete',
        'widget:update',
        'widget:list'
      ];

      if (validChannels.includes(channel)) {
        try {
          return await ipcRenderer.invoke(channel, ...args);
        } catch (error) {
          console.error(`Error invoking ${channel}:`, error);
          throw error;
        }
      }

      throw new Error(`Invalid channel: ${channel}`);
    }
  }
);
