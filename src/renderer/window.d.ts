import { IElectronAPI } from '../types/electron';
import { WidgetConfig } from '../types/config';

declare global {
  interface Window {
    api: IElectronAPI;
    widgetConfig: WidgetConfig;
  }
} 