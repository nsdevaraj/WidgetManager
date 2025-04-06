import { AppSettings } from '../../types/config';

declare global {
  interface Window {
    electron: {
      invoke(channel: 'settings:get'): Promise<AppSettings>;
      invoke(channel: 'settings:update', settings: AppSettings): Promise<void>;
      invoke(channel: string, ...args: any[]): Promise<any>;
    };
  }
} 