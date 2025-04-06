import type { WidgetConfig, StoreSchema } from '../main/store';

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
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}

export {}; 