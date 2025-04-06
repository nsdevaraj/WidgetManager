// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Add any methods you want to expose to the renderer process here
    // For example:
    // send: (channel: string, data: any) => {
    //   ipcRenderer.send(channel, data);
    // },
    // receive: (channel: string, func: Function) => {
    //   ipcRenderer.on(channel, (event, ...args) => func(...args));
    // }
  }
);
