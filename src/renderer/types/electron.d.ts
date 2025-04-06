import { AppSettings } from '../../types/config';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
}

export interface UpdateProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  // Settings methods
  invoke(channel: "settings:get"): Promise<{
    defaultSize?: { width?: number; height?: number };
    gridSnapping?: boolean;
    theme?: "light" | "dark" | "system";
    startupBehavior?: "restore" | "minimized";
    startAtLogin?: boolean;
    widgetGroups?: Array<{
      id: string;
      name: string;
      widgets: Array<{
        id: string;
        url: string;
        position: { x: number; y: number };
        size: { width: number; height: number };
      }>;
    }>;
    resourceManagement?: {
      maxMemoryPerWidget: number;
      maxCPUPerWidget: number;
    };
  }>;
  invoke(channel: "settings:update", ...args: any[]): Promise<void>;
  
  // Auto-updater methods
  checkForUpdates(): Promise<void>;
  downloadUpdate(): Promise<void>;
  quitAndInstall(): Promise<void>;
  onUpdateAvailable(callback: (event: Electron.IpcRendererEvent, info: UpdateInfo) => void): void;
  onUpdateDownloaded(callback: (event: Electron.IpcRendererEvent, info: UpdateInfo) => void): void;
  onUpdaterMessage(callback: (event: Electron.IpcRendererEvent, data: { message: string; data?: any }) => void): void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
} 