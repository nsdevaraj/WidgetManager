import { WidgetConfig } from '../types/config';
import { storeHelpers } from './store';
import { WidgetWindow } from './widget-window';

export class WidgetManager {
  private static instance: WidgetManager | null = null;
  private widgets: Map<string, WidgetWindow>;

  private constructor() {
    // Initialize widgets from store
    this.widgets = new Map();
    const storedWidgets = storeHelpers.getWidgets();
    storedWidgets.forEach((widget: WidgetConfig) => {
      this.widgets.set(widget.id, new WidgetWindow(widget));
    });
  }

  static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  addWidget(widget: Partial<WidgetConfig>): Promise<WidgetConfig> {
    try {
      // Use storeHelpers to add widget with proper validation and ID generation
      const newWidget = storeHelpers.addWidget(widget);
      const widgetWindow = new WidgetWindow(newWidget);
      this.widgets.set(newWidget.id, widgetWindow);
      return Promise.resolve(newWidget);
    } catch (error) {
      console.error('Failed to add widget:', error);
      return Promise.reject(error);
    }
  }

  updateWidget(id: string, updates: Partial<WidgetConfig>): Promise<WidgetConfig> {
    try {
      const widgetWindow = this.widgets.get(id);
      if (!widgetWindow) {
        throw new Error(`Widget with id ${id} not found`);
      }

      // Update window first
      widgetWindow.updateConfig(updates);
      
      // Get the updated config from the window
      const updatedConfig = widgetWindow.getConfig();
      
      // Update store with the full config
      storeHelpers.updateWidget(id, updatedConfig);
      
      return Promise.resolve(updatedConfig);
    } catch (error) {
      console.error('Failed to update widget:', error);
      return Promise.reject(error);
    }
  }

  removeWidget(id: string): Promise<boolean> {
    try {
      const widgetWindow = this.widgets.get(id);
      if (!widgetWindow) {
        return Promise.resolve(false);
      }

      // Remove from store first
      storeHelpers.removeWidget(id);
      
      // Dispose window and remove from map
      widgetWindow.dispose();
      this.widgets.delete(id);
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('Failed to remove widget:', error);
      return Promise.reject(error);
    }
  }

  listWidgets(): Promise<WidgetConfig[]> {
    try {
      const configs = Array.from(this.widgets.values()).map(window => window.getConfig());
      return Promise.resolve(configs);
    } catch (error) {
      console.error('Failed to list widgets:', error);
      return Promise.reject(error);
    }
  }

  dispose(): void {
    // Dispose all widget windows
    this.widgets.forEach(widget => widget.dispose());
    this.widgets.clear();
    WidgetManager.instance = null;
  }
}

export function initializeWidgetManagement(): WidgetManager {
  return WidgetManager.getInstance();
} 