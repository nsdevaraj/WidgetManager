import { ipcMain } from 'electron';
import { store, storeHelpers } from './store';

// Widget operations
ipcMain.handle('widget:add', async (_, widget) => {
  return storeHelpers.addWidget(widget);
});

ipcMain.handle('widget:remove', async (_, id) => {
  storeHelpers.removeWidget(id);
  return true;
});

ipcMain.handle('widget:update', async (_, { id, updates }) => {
  storeHelpers.updateWidget(id, updates);
  return true;
});

ipcMain.handle('widget:list', async () => {
  return store.get('widgets');
});

// Settings operations
ipcMain.handle('settings:get', async () => {
  return store.get('settings');
});

ipcMain.handle('settings:update', async (_, updates) => {
  storeHelpers.updateSettings(updates);
  return store.get('settings');
}); 