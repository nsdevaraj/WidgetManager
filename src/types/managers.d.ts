import { BrowserWindow } from 'electron';
import { WidgetConfig, AppSettings } from './config';
import { Screen } from './window';

declare module './window-manager' {
  export class WindowManager {
    static getInstance(window: BrowserWindow): WindowManager;
    dispose(): void;
  }
  export function initializeWindowManagement(window: BrowserWindow): WindowManager;
}

declare module './screen-manager' {
  export class ScreenManager {
    static getInstance(window: BrowserWindow): ScreenManager;
    dispose(): void;
  }
  export function initializeScreenManagement(window: BrowserWindow): ScreenManager;
}

declare module './widget-manager' {
  export class WidgetManager {
    static getInstance(): WidgetManager;
    listWidgets(): WidgetConfig[];
    addWidget(config: Partial<WidgetConfig>): WidgetConfig;
    updateWidget(id: string, updates: Partial<WidgetConfig>): WidgetConfig;
    removeWidget(id: string): boolean;
    dispose(): void;
  }
  export function initializeWidgetManagement(): WidgetManager;
}

declare module './settings-manager' {
  export class SettingsManager {
    static getInstance(): SettingsManager;
    getSettings(): AppSettings;
    updateSettings(updates: Partial<AppSettings>): AppSettings;
    resetSettings(): AppSettings;
    dispose(): void;
  }
  export function initializeSettingsManagement(): SettingsManager;
}

declare module './store' {
  export const store: {
    get<T>(key: string, defaultValue: T): T;
    set<T>(key: string, value: T): void;
  };

  export const storeHelpers: {
    addWidget(config: Partial<WidgetConfig>): WidgetConfig;
    updateWidget(id: string, updates: Partial<WidgetConfig>): void;
    removeWidget(id: string): void;
    updateSettings(updates: Partial<AppSettings>): void;
  };
} 