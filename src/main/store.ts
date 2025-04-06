import Store from 'electron-store';

export interface WidgetConfig {
  id: string;
  isVisible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  type: string;
  settings: Record<string, unknown>;
}

interface StoreSchema {
  widgets: WidgetConfig[];
  settings: {
    startAtLogin: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

// Create store instance with proper typing
const store = new Store<StoreSchema>({
  defaults: {
    widgets: [],
    settings: {
      startAtLogin: true,
      theme: 'system'
    }
  }
});

// Type assertion to include the correct method signatures
export const typedStore = store as unknown as {
  get<K extends keyof StoreSchema>(key: K): StoreSchema[K];
  get<K extends keyof StoreSchema>(key: K, defaultValue: StoreSchema[K]): StoreSchema[K];
  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void;
};

export const storeHelpers = {
  addWidget: (widget: Omit<WidgetConfig, 'id'>) => {
    const widgets = typedStore.get('widgets');
    const newWidget: WidgetConfig = {
      ...widget,
      id: Date.now().toString(),
    };
    typedStore.set('widgets', [...widgets, newWidget]);
    return newWidget;
  },

  removeWidget: (id: string) => {
    const widgets = typedStore.get('widgets');
    typedStore.set('widgets', widgets.filter((w: WidgetConfig) => w.id !== id));
  },

  updateWidget: (id: string, updates: Partial<WidgetConfig>) => {
    const widgets = typedStore.get('widgets');
    typedStore.set(
      'widgets',
      widgets.map((w: WidgetConfig) => (w.id === id ? { ...w, ...updates } : w))
    );
  },

  updateSettings: (updates: Partial<StoreSchema['settings']>) => {
    const settings = typedStore.get('settings');
    typedStore.set('settings', { ...settings, ...updates });
  },
};

export { typedStore as store }; 