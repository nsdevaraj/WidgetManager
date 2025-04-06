import { WidgetConfig } from '../types/config';
import { storeHelpers } from './store';

export class WidgetManager {
  private static instance: WidgetManager | null = null;
  private widgets: Map<string, WidgetConfig>;

  private constructor() {
    // Initialize widgets from store
    this.widgets = new Map();
    const storedWidgets = storeHelpers.getWidgets();
    storedWidgets.forEach((widget: WidgetConfig) => {
      this.widgets.set(widget.id, widget);
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
      this.widgets.set(newWidget.id, newWidget);
      return Promise.resolve(newWidget);
    } catch (error) {
      console.error('Failed to add widget:', error);
      return Promise.reject(error);
    }
  }

  removeWidget(id: string): Promise<void> {
    try {
      storeHelpers.removeWidget(id);
      this.widgets.delete(id);
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to remove widget:', error);
      return Promise.reject(error);
    }
  }

  updateWidget(id: string, updates: Partial<WidgetConfig>): Promise<WidgetConfig> {
    try {
      const widget = this.widgets.get(id);
      if (!widget) {
        throw new Error(`Widget with id ${id} not found`);
      }
      storeHelpers.updateWidget(id, updates);
      const updatedWidget = { ...widget, ...updates };
      this.widgets.set(id, updatedWidget);
      return Promise.resolve(updatedWidget);
    } catch (error) {
      console.error('Failed to update widget:', error);
      return Promise.reject(error);
    }
  }

  listWidgets(): Promise<WidgetConfig[]> {
    try {
      return Promise.resolve(Array.from(this.widgets.values()));
    } catch (error) {
      console.error('Failed to list widgets:', error);
      return Promise.reject(error);
    }
  }

  dispose(): void {
    this.widgets.clear();
    WidgetManager.instance = null;
  }
}

export function initializeWidgetManagement(): WidgetManager {
  return WidgetManager.getInstance();
} 