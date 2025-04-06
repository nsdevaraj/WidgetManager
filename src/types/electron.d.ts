import { WidgetConfig } from './config';

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
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
} 