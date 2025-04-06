import { WidgetConfig, AppSettings, WidgetResourceMetrics } from './config';
import { IpcRendererEvent } from 'electron';

export interface Screen {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IElectronAPI {
  // Settings management
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  resetSettings: () => Promise<AppSettings>;

  // Event handling
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;

  // Widget management
  listWidgets: () => Promise<WidgetConfig[]>;
  addWidget: (config: Partial<WidgetConfig>) => Promise<WidgetConfig>;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<WidgetConfig>;
  deleteWidget: (id: string) => Promise<void>;

  // Screen management
  getScreens: () => Promise<Screen[]>;
  getPrimaryScreen: () => Promise<Screen>;
  getCurrentScreen: () => Promise<Screen>;

  // Window management
  getPosition: () => Promise<{ x: number; y: number }>;
  setPosition: (x: number, y: number) => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  restore: () => Promise<void>;
  close: () => Promise<void>;

  // Window drag and resize events
  onStartDrag: () => void;
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: () => void;

  // BrowserView management
  createBrowserView: (id: string, url: string) => void;
  destroyBrowserView: (id: string) => void;
  setBrowserViewBounds: (id: string, bounds: Bounds) => void;

  // Resource monitoring
  getWidgetMetrics: (widgetId: string) => Promise<WidgetResourceMetrics | null>;
  onMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => void;
  offMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

// Add type declarations for the IPC channels
declare module 'electron' {
  interface IpcRenderer {
    invoke(channel: 'settings:get'): Promise<AppSettings>;
    invoke(channel: 'settings:update', settings: Partial<AppSettings>): Promise<AppSettings>;
    invoke(channel: 'settings:reset'): Promise<AppSettings>;
    invoke(channel: 'widget:list'): Promise<WidgetConfig[]>;
    invoke(channel: 'widget:add', config: Partial<WidgetConfig>): Promise<WidgetConfig>;
    invoke(channel: 'widget:update', data: { id: string; updates: Partial<WidgetConfig> }): Promise<WidgetConfig>;
    invoke(channel: 'widget:delete', id: string): Promise<void>;
    invoke(channel: `widget:${string}:get-metrics`): Promise<WidgetResourceMetrics | null>;
    invoke(channel: string, ...args: any[]): Promise<any>;

    on(channel: 'widget:metrics-update', listener: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void): this;
    removeListener(channel: 'widget:metrics-update', listener: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void): this;
  }
} 