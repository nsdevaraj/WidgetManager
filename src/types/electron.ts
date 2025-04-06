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
  isPrimary: boolean;
  scaleFactor: number;
}

export interface IElectronAPI {
  // Widget management
  listWidgets: () => Promise<any[]>;
  addWidget: (config: any) => Promise<any>;
  updateWidget: (id: string, updates: any) => Promise<any>;
  deleteWidget: (id: string) => Promise<void>;
  
  // Window management
  onStartDrag: () => void;
  onMouseMove: (x: number, y: number) => void;
  onMouseUp: () => void;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // Screen management
  getScreens: () => Promise<Screen[]>;
  getPrimaryScreen: () => Promise<Screen>;
  getCurrentScreen: () => Promise<Screen>;
  getPosition: () => Promise<{ x: number; y: number }>;
  setPosition: (x: number, y: number) => Promise<void>;
  restore: () => Promise<void>;

  // BrowserView management
  createBrowserView: (id: string, url: string) => void;
  destroyBrowserView: (id: string) => void;
  setBrowserViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => void;
} 