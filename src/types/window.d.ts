import { WidgetConfig } from './config';
import { Screen, WindowPosition, WindowSize } from './types';

export interface IElectronAPI {
  // Widget management
  listWidgets: () => Promise<WidgetConfig[]>;
  addWidget: (config: any) => Promise<any>;
  updateWidget: (id: string, updates: any) => Promise<any>;
  deleteWidget: (id: string) => Promise<void>;
  
  // Screen management
  getScreens: () => Promise<Screen[]>;
  getPrimaryScreen: () => Promise<Screen>;
  getCurrentScreen: () => Promise<Screen>;
  
  // Window management
  getPosition: () => Promise<WindowPosition>;
  setPosition: (x: number, y: number) => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  restore: () => Promise<void>;
  close: () => Promise<void>;

  // Settings management
  getSettings: () => Promise<any>;
  updateSettings: (updates: any) => Promise<any>;
  resetSettings: () => Promise<any>;

  // Window drag and resize events
  onStartDrag: () => void;
  onStartResize: (direction: 'bottom' | 'right' | 'bottomRight') => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: () => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

export {}; 