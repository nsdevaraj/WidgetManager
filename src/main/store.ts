import Store from 'electron-store';
import { app } from 'electron';
import {
  StoreSchema,
  WidgetConfig,
  AppSettings,
  defaultAppSettings,
  defaultWidgetConfig,
  validateWidgetConfig,
  validateAppSettings,
  validateStoreSchema
} from '../types/config';

interface StoreOptions {
  type: 'set' | 'get';
  key: keyof StoreSchema;
  value?: unknown;
}

// Create store instance with proper typing
const store = new Store<StoreSchema>({
  defaults: {
    widgets: [],
    settings: defaultAppSettings
  },
  beforeEach: (options: StoreOptions) => {
    // Validate data before saving
    if (options.type === 'set') {
      try {
        if (options.key === 'widgets') {
          (options.value as WidgetConfig[]).forEach(validateWidgetConfig);
        } else if (options.key === 'settings') {
          validateAppSettings(options.value);
        }
      } catch (error) {
        console.error('Validation error:', error);
        throw error;
      }
    }
  },
  migrations: {
    // Example migration for future schema changes
    '>=1.0.0': (migrateStore: any) => {
      try {
        const data = migrateStore.get('.') as StoreSchema;
        validateStoreSchema(data);
      } catch (error) {
        console.error('Migration validation error:', error);
        // Reset to defaults if validation fails
        migrateStore.clear();
      }
    }
  }
});

// Helper functions for store operations
export const storeHelpers = {
  addWidget: (widget: Omit<WidgetConfig, 'id'>): WidgetConfig => {
    const widgets = (store as any).get('widgets') ?? [];
    const newWidget: WidgetConfig = {
      ...defaultWidgetConfig,
      ...widget,
      id: Date.now().toString()
    };
    validateWidgetConfig(newWidget);
    (store as any).set('widgets', [...widgets, newWidget]);
    return newWidget;
  },

  removeWidget: (id: string): void => {
    const widgets = (store as any).get('widgets') ?? [];
    (store as any).set('widgets', widgets.filter((w: WidgetConfig) => w.id !== id));
  },

  updateWidget: (id: string, updates: Partial<WidgetConfig>): void => {
    const widgets = (store as any).get('widgets') ?? [];
    const updatedWidgets = widgets.map((w: WidgetConfig) => {
      if (w.id === id) {
        const updatedWidget = { ...w, ...updates };
        validateWidgetConfig(updatedWidget);
        return updatedWidget;
      }
      return w;
    });
    (store as any).set('widgets', updatedWidgets);
  },

  updateSettings: (updates: Partial<AppSettings>): void => {
    const settings = (store as any).get('settings') ?? defaultAppSettings;
    const updatedSettings = { ...settings, ...updates };
    validateAppSettings(updatedSettings);
    (store as any).set('settings', updatedSettings);

    // Handle special settings
    if (updates.startAtLogin !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: updates.startAtLogin
      });
    }
  },

  // Export configuration
  exportConfig: (): StoreSchema => {
    const data = {
      widgets: (store as any).get('widgets') ?? [],
      settings: (store as any).get('settings') ?? defaultAppSettings
    };
    return validateStoreSchema(data);
  },

  // Import configuration
  importConfig: (config: unknown): void => {
    const validConfig = validateStoreSchema(config);
    (store as any).clear();
    (store as any).set('widgets', validConfig.widgets);
    (store as any).set('settings', validConfig.settings);
  },

  // Subscribe to changes
  onConfigChange: (callback: (newValue: StoreSchema) => void): (() => void) => {
    return (store as any).onDidAnyChange((newValue: unknown) => {
      try {
        const validConfig = validateStoreSchema(newValue);
        callback(validConfig);
      } catch (error) {
        console.error('Configuration change validation error:', error);
      }
    });
  }
};

export { store }; 