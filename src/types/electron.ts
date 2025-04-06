import { AppSettings, WidgetConfig, WidgetResourceMetrics } from './config';
import { IpcRendererEvent } from 'electron';

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
  deleteWidget: (id: string) => Promise<boolean>;

  // Window management
  onStartDrag: () => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: () => void;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  restore: () => Promise<void>;
  getPosition: () => Promise<{ x: number; y: number }>;
  setPosition: (x: number, y: number) => Promise<void>;

  // Screen management
  getScreens: () => Promise<any[]>;
  getPrimaryScreen: () => Promise<any>;
  getCurrentScreen: () => Promise<any>;

  // Window drag and resize events
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => void;

  // BrowserView management
  createBrowserView: (id: string, url: string) => void;
  destroyBrowserView: (id: string) => void;
  setBrowserViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => void;

  // Resource monitoring
  getWidgetMetrics: (widgetId: string) => Promise<WidgetResourceMetrics | null>;
  onMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => void;
  offMetricsUpdate: (callback: (event: IpcRendererEvent, metrics: WidgetResourceMetrics) => void) => void;
} 