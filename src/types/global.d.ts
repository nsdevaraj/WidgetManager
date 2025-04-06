import { IElectronAPI } from './electron';

declare global {
  interface Window {
    api: IElectronAPI;
  }
} 