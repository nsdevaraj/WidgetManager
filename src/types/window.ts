export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface IElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  getWindowPosition: () => Promise<WindowPosition>;
  setWindowPosition: (position: WindowPosition) => void;
  getWindowSize: () => Promise<WindowSize>;
  setWindowSize: (size: WindowSize) => void;
  startWindowDrag: () => void;
  startWindowResize: (direction: 'bottom' | 'right' | 'bottomRight') => void;
} 