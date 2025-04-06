import { AppSettings, defaultAppSettings, validateAppSettings } from '../types/config';
import { store } from './store';
import { app } from 'electron';

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: AppSettings;
  private initialized: boolean = false;

  private constructor() {
    this.settings = defaultAppSettings;
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadSettings();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize settings manager:', error);
      throw new Error('Failed to initialize settings manager');
    }
  }

  private async loadSettings() {
    try {
      const savedSettings = await store.get('settings');
      if (savedSettings) {
        this.settings = validateAppSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = defaultAppSettings;
      // Attempt to save default settings
      try {
        await store.set('settings', defaultAppSettings);
      } catch (saveError) {
        console.error('Failed to save default settings:', saveError);
      }
    }
  }

  private async applySettings(settings: AppSettings) {
    try {
      // Apply theme
      if (settings.theme !== 'system') {
        // TODO: Implement theme switching
        // For now, just log that we would change the theme
        console.log('Would switch theme to:', settings.theme);
      }

      // Apply startup behavior
      if (settings.startAtLogin) {
        app.setLoginItemSettings({
          openAtLogin: true,
          openAsHidden: settings.startupBehavior === 'minimized'
        });
      } else {
        app.setLoginItemSettings({
          openAtLogin: false
        });
      }

      // Notify renderer about settings changes
      // We'll implement this when we add real-time sync between windows
    } catch (error) {
      console.error('Error applying settings:', error);
      throw new Error('Failed to apply settings');
    }
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const newSettings = {
        ...this.settings,
        ...updates,
      };
      
      const validatedSettings = validateAppSettings(newSettings);
      await store.set('settings', validatedSettings);
      this.settings = validatedSettings;
      await this.applySettings(validatedSettings);
      return validatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  async resetSettings(): Promise<AppSettings> {
    try {
      await store.set('settings', defaultAppSettings);
      this.settings = defaultAppSettings;
      await this.applySettings(defaultAppSettings);
      return defaultAppSettings;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw new Error('Failed to reset settings');
    }
  }

  dispose(): void {
    if (SettingsManager.instance) {
      SettingsManager.instance = null;
      this.initialized = false;
    }
  }
}

export async function initializeSettingsManagement(): Promise<SettingsManager> {
  const manager = SettingsManager.getInstance();
  await manager.initialize();
  return manager;
} 