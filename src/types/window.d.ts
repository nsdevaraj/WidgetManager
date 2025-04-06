import type { WidgetConfig } from './config';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

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

export interface IElectronAPI {
  // Widget operations
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<void>;
  listWidgets: () => Promise<WidgetConfig[]>;

  // Settings operations
  getSettings: () => Promise<any>;
  updateSettings: (updates: any) => Promise<void>;

  // Window control functions
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // Window position and size management
  getWindowPosition: () => Promise<WindowPosition>;
  setWindowPosition: (position: WindowPosition) => void;
  getWindowSize: () => Promise<WindowSize>;
  setWindowSize: (size: WindowSize) => void;
  startWindowDrag: () => void;
  startWindowResize: (direction: 'bottom' | 'right' | 'bottomRight') => void;

  // Screen management
  getScreens: () => Promise<Screen[]>;
  getPrimaryScreen: () => Promise<Screen>;
  getCurrentScreen: () => Promise<Screen>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

export {}; 