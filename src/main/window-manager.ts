import { BrowserWindow, ipcMain } from 'electron';
import type { WindowPosition, WindowSize } from '../types/window';

export class WindowManager {
  private window: BrowserWindow;
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private dragOffset: WindowPosition = { x: 0, y: 0 };

  constructor(window: BrowserWindow) {
    this.window = window;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Window position and size management
    ipcMain.handle('window:get-position', () => {
      const [x, y] = this.window.getPosition();
      return { x, y };
    });

    ipcMain.on('window:set-position', (_, position: WindowPosition) => {
      this.window.setPosition(position.x, position.y);
    });

    ipcMain.handle('window:get-size', () => {
      const [width, height] = this.window.getSize();
      return { width, height };
    });

    ipcMain.on('window:set-size', (_, size: WindowSize) => {
      this.window.setSize(size.width, size.height);
    });

    // Window dragging
    ipcMain.on('window:start-drag', async () => {
      if (this.isResizing) return;
      this.isDragging = true;
      
      try {
        // Get current cursor position and window position
        const cursorPosStr = await this.window.webContents.executeJavaScript(
          'JSON.stringify({ x: event.screenX, y: event.screenY })'
        );
        const cursorPos = JSON.parse(cursorPosStr);
        const [winX, winY] = this.window.getPosition();
        
        // Calculate offset
        this.dragOffset = {
          x: cursorPos.x - winX,
          y: cursorPos.y - winY
        };
      } catch (error) {
        console.error('Failed to start window drag:', error);
        this.isDragging = false;
      }
    });

    // Window resizing
    ipcMain.on('window:start-resize', async (_, direction: 'bottom' | 'right' | 'bottomRight') => {
      if (this.isDragging) return;
      this.isResizing = true;

      try {
        // Store initial window size and cursor position
        const [width, height] = this.window.getSize();
        const cursorPosStr = await this.window.webContents.executeJavaScript(
          'JSON.stringify({ x: event.screenX, y: event.screenY })'
        );
        const cursorPos = JSON.parse(cursorPosStr);

        // Handle mouse movement for resizing
        const mouseMoveHandler = (e: Electron.Event, pos: { x: number; y: number }) => {
          if (!this.isResizing) return;

          const deltaX = pos.x - cursorPos.x;
          const deltaY = pos.y - cursorPos.y;
          let newWidth = width;
          let newHeight = height;

          switch (direction) {
            case 'right':
              newWidth = Math.max(400, width + deltaX);
              break;
            case 'bottom':
              newHeight = Math.max(300, height + deltaY);
              break;
            case 'bottomRight':
              newWidth = Math.max(400, width + deltaX);
              newHeight = Math.max(300, height + deltaY);
              break;
          }

          this.window.setSize(newWidth, newHeight);
        };

        // Handle mouse up to stop resizing
        const mouseUpHandler = () => {
          this.isResizing = false;
          ipcMain.removeListener('window:mouse-move', mouseMoveHandler);
          ipcMain.removeListener('window:mouse-up', mouseUpHandler);
        };

        ipcMain.on('window:mouse-move', mouseMoveHandler);
        ipcMain.on('window:mouse-up', mouseUpHandler);
      } catch (error) {
        console.error('Failed to start window resize:', error);
        this.isResizing = false;
      }
    });

    // Mouse move and up events for dragging
    ipcMain.on('window:mouse-move', (_, pos: { x: number; y: number }) => {
      if (!this.isDragging) return;
      this.window.setPosition(
        pos.x - this.dragOffset.x,
        pos.y - this.dragOffset.y
      );
    });

    ipcMain.on('window:mouse-up', () => {
      this.isDragging = false;
    });
  }

  // Clean up event listeners
  dispose() {
    ipcMain.removeHandler('window:get-position');
    ipcMain.removeHandler('window:get-size');
    ipcMain.removeAllListeners('window:set-position');
    ipcMain.removeAllListeners('window:set-size');
    ipcMain.removeAllListeners('window:start-drag');
    ipcMain.removeAllListeners('window:start-resize');
    ipcMain.removeAllListeners('window:mouse-move');
    ipcMain.removeAllListeners('window:mouse-up');
  }
} 