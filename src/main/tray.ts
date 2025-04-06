import { Tray, Menu, app, BrowserWindow } from 'electron';
import path from 'path';
import { store, storeHelpers, WidgetConfig } from './store';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow) {
  // Create tray icon
  const iconPath = path.join(__dirname, 'assets', 'tray-icon-template.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Widget Desktop');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Widgets',
      click: () => {
        const widgets = store.get('widgets', [] as WidgetConfig[]);
        const allVisible = widgets.every((w: WidgetConfig) => w.isVisible);
        
        widgets.forEach((widget: WidgetConfig) => {
          storeHelpers.updateWidget(widget.id, { isVisible: !allVisible });
        });
      },
    },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Start at Login',
      type: 'checkbox',
      checked: store.get('settings').startAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
        });
        storeHelpers.updateSettings({ startAtLogin: menuItem.checked });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

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
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
} 