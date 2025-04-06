export interface IElectronAPI {
  // Add method signatures here as we implement them
  // Example:
  // send: (channel: string, data: any) => void;
  // receive: (channel: string, func: Function) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
} 