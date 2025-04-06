import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron';
import { store, storeHelpers } from './store';
import { defaultAppSettings } from '../types/config';
import path from 'path';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow): Tray {
  if (tray !== null) {
    return tray;
  }

  // Create tray icon
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'))
    .resize({ width: 16, height: 16 }); // Resize for better appearance on macOS
  
  if (icon.isEmpty()) {
    console.error('Failed to load tray icon');
  }
  
  // Create tray with icon
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Widgets',
      click: () => {
        const widgets = store.get('widgets', []);
        const allVisible = widgets.every((w) => w.isVisible);
        
        widgets.forEach((widget) => {
          storeHelpers.updateWidget(widget.id, { isVisible: !allVisible });
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Start at Login',
      type: 'checkbox',
      checked: store.get('settings', defaultAppSettings).startAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          path: app.getPath('exe')
        });
        storeHelpers.updateSettings({ startAtLogin: menuItem.checked });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Widget Desktop');
  tray.setContextMenu(contextMenu);

  // Double click shows/hides the main window
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
} 