import Store from 'electron-store';
import { app } from 'electron';
import { EventEmitter } from 'events';
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

// Validation functions
const validatePosition = (position: { x?: number; y?: number }): { x: number; y: number } => {
  if (typeof position?.x !== 'number' || typeof position?.y !== 'number') {
    throw new Error('Invalid position coordinates');
  }
  if (Math.abs(position.x) > 10000 || Math.abs(position.y) > 10000) {
    throw new Error('Position coordinates out of bounds');
  }
  return { x: position.x, y: position.y };
};

const validateWidgetUpdate = (widget: WidgetConfig, updates: Partial<WidgetConfig>) => {
  // Validate position updates
  if (updates.position) {
    const validatedPosition = validatePosition(updates.position);
    updates.position = validatedPosition;
  }

  // Validate size updates
  if (updates.size) {
    if (updates.size.width < 50 || updates.size.height < 50) {
      throw new Error('Widget size too small');
    }
    if (updates.size.width > 2000 || updates.size.height > 2000) {
      throw new Error('Widget size too large');
    }
  }

  // Ensure required fields aren't removed
  const updatedWidget = { ...widget, ...updates };
  if (!updatedWidget.id || !updatedWidget.type || !updatedWidget.position || !updatedWidget.size) {
    throw new Error('Required widget fields cannot be removed');
  }

  return updatedWidget;
};

// Create store instance with proper typing
const store = new Store<StoreSchema>({
  defaults: {
    widgets: [],
    settings: defaultAppSettings
  },
  watch: true,
  migrations: {
    // Example migration for future schema changes
    '>=1.0.0': (store: Store<StoreSchema>) => {
      try {
        const data = store.store;
        validateStoreSchema(data);
      } catch (error) {
        console.error('Migration validation error:', error);
        // Reset to defaults if validation fails
        store.clear();
      }
    }
  }
});

// Helper functions for store operations
export const storeHelpers = {
  getWidgets: (): WidgetConfig[] => {
    try {
      const widgets = store.get('widgets', []);
      // Validate all widgets on load
      widgets.forEach(validateWidgetConfig);
      return widgets;
    } catch (error) {
      console.error('Error loading widgets:', error);
      return [];
    }
  },

  addWidget: (widget: Omit<WidgetConfig, 'id'>): WidgetConfig => {
    try {
      const widgets = store.get('widgets', []);
      const newWidget: WidgetConfig = {
        ...defaultWidgetConfig,
        ...widget,
        id: Date.now().toString()
      };
      validateWidgetConfig(newWidget);
      validatePosition(newWidget.position);
      store.set('widgets', [...widgets, newWidget]);
      return newWidget;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  },

  removeWidget: (id: string): void => {
    try {
      const widgets = store.get('widgets', []);
      store.set('widgets', widgets.filter((w: WidgetConfig) => w.id !== id));
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  },

  updateWidget: (id: string, updates: Partial<WidgetConfig>): void => {
    try {
      const widgets = store.get('widgets', []);
      const updatedWidgets = widgets.map((w: WidgetConfig) => {
        if (w.id === id) {
          const updatedWidget = validateWidgetUpdate(w, updates);
          validateWidgetConfig(updatedWidget);
          return updatedWidget;
        }
        return w;
      });
      store.set('widgets', updatedWidgets);
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  },

  updateSettings: (updates: Partial<AppSettings>): void => {
    try {
      const settings = store.get('settings', defaultAppSettings);
      const updatedSettings = { ...settings, ...updates };
      validateAppSettings(updatedSettings);
      store.set('settings', updatedSettings);

      // Handle special settings
      if (updates.startAtLogin !== undefined) {
        app.setLoginItemSettings({
          openAtLogin: updates.startAtLogin
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  getSettings: (): AppSettings => {
    try {
      return store.get('settings', defaultAppSettings);
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultAppSettings;
    }
  },

  resetSettings: (): void => {
    try {
      store.set('settings', defaultAppSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },

  // Export configuration
  exportConfig: (): StoreSchema => {
    try {
      const data = {
        widgets: store.get('widgets', []),
        settings: store.get('settings', defaultAppSettings)
      };
      return validateStoreSchema(data);
    } catch (error) {
      console.error('Error exporting config:', error);
      throw error;
    }
  },

  // Import configuration
  importConfig: (config: unknown): void => {
    try {
      const validConfig = validateStoreSchema(config);
      store.clear();
      store.set('widgets', validConfig.widgets);
      store.set('settings', validConfig.settings);
    } catch (error) {
      console.error('Error importing config:', error);
      throw error;
    }
  },

  // Subscribe to changes
  onConfigChange: (callback: (newValue: StoreSchema) => void): (() => void) => {
    return store.onDidAnyChange((newValue: unknown) => {
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