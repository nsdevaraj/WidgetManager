import { IElectronAPI } from './window';

declare global {
  interface Window {
    api: IElectronAPI;
  }
} 