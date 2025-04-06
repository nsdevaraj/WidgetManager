import { ElectronAPI } from '../types/electron';
import { WidgetConfig } from '../types/config';

declare global {
  interface Window {
    api: ElectronAPI;
    widgetConfig: WidgetConfig;
  }
} 