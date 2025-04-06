import type { WidgetConfig, StoreSchema } from '../main/store';

export interface IElectronAPI {
  // Widget operations
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => Promise<WidgetConfig>;
  removeWidget: (id: string) => Promise<boolean>;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<boolean>;
  listWidgets: () => Promise<WidgetConfig[]>;

  // Settings operations
  getSettings: () => Promise<StoreSchema['settings']>;
  updateSettings: (updates: Partial<StoreSchema['settings']>) => Promise<StoreSchema['settings']>;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
} 