import { screen, ipcMain } from 'electron';
import { Screen } from '../types/window';

/**
 * Convert an Electron Display object to our Screen interface
 */
const convertDisplay = (display: Electron.Display): Screen => {
  return {
    id: display.id.toString(),
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    isPrimary: display.id === screen.getPrimaryDisplay().id
  };
};

/**
 * Initialize screen management IPC handlers
 */
export const initializeScreenManagement = () => {
  // Get all screens
  ipcMain.handle('screen:get-all', () => {
    const displays = screen.getAllDisplays();
    return displays.map(convertDisplay);
  });

  // Get primary screen
  ipcMain.handle('screen:get-primary', () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    return convertDisplay(primaryDisplay);
  });

  // Get current screen (screen containing cursor)
  ipcMain.handle('screen:get-current', () => {
    const cursorPoint = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
    return convertDisplay(currentDisplay);
  });

  // Listen for screen changes
  screen.on('display-added', () => {
    // Handle screen added
  });

  screen.on('display-removed', () => {
    // Handle screen removed
  });

  screen.on('display-metrics-changed', () => {
    // Handle screen metrics changed
  });
}; 