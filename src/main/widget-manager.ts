import { WidgetConfig } from '../types/config';

export class WidgetManager {
  private static instance: WidgetManager | null = null;
  private widgets: Map<string, WidgetConfig> = new Map();

  private constructor() {}

  static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  addWidget(widget: WidgetConfig): Promise<WidgetConfig> {
    this.widgets.set(widget.id, widget);
    return Promise.resolve(widget);
  }

  removeWidget(id: string): Promise<void> {
    this.widgets.delete(id);
    return Promise.resolve();
  }

  updateWidget(id: string, updates: Partial<WidgetConfig>): Promise<WidgetConfig> {
    const widget = this.widgets.get(id);
    if (!widget) {
      return Promise.reject(new Error(`Widget with id ${id} not found`));
    }
    const updatedWidget = { ...widget, ...updates };
    this.widgets.set(id, updatedWidget);
    return Promise.resolve(updatedWidget);
  }

  listWidgets(): Promise<WidgetConfig[]> {
    return Promise.resolve(Array.from(this.widgets.values()));
  }

  dispose(): void {
    this.widgets.clear();
    WidgetManager.instance = null;
  }
}

export function initializeWidgetManagement(): WidgetManager {
  return WidgetManager.getInstance();
} 