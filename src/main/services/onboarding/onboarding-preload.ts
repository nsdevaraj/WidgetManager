import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'onboarding', {
        complete: () => ipcRenderer.invoke('onboarding:complete'),
        skip: () => ipcRenderer.invoke('onboarding:skip'),
        getAnalyticsEnabled: () => ipcRenderer.invoke('analytics:getEnabled'),
        setAnalyticsEnabled: (enabled: boolean) => ipcRenderer.invoke('analytics:setEnabled', enabled),
        getLicenseInfo: () => ipcRenderer.invoke('license:getInfo'),
        activateLicense: (key: string, email: string) => ipcRenderer.invoke('license:activate', key, email),
        startTrial: (email: string) => ipcRenderer.invoke('license:startTrial', email),
    }
); 