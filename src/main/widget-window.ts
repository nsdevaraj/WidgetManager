import { BrowserWindow, ipcMain, BrowserView, app, ProcessMemoryInfo } from 'electron';
import { WidgetConfig, WidgetResourceMetrics } from '../types/config';

declare const WIDGET_WINDOW_WEBPACK_ENTRY: string;
declare const WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Constants for resource management
const BACKGROUND_THROTTLE_INTERVAL = 1000; // 1 second
const BACKGROUND_CPU_LIMIT = 10; // 10% CPU usage limit for background widgets
const BACKGROUND_MEMORY_LIMIT = 100 * 1024 * 1024; // 100MB memory limit for background widgets
const RESOURCE_CHECK_INTERVAL = 5000; // Check resources every 5 seconds

export class WidgetWindow {
  private window: BrowserWindow;
  private config: WidgetConfig;
  private browserView: BrowserView | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private isVisible: boolean = true;
  private isThrottled: boolean = false;
  private resourceCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.window = this.createWindow();
    this.setupWindow();
    this.setupIPC();
    this.startResourceMonitoring();
    this.startResourceThrottling();
  }

  private createWindow(): BrowserWindow {
    return new BrowserWindow({
      width: this.config.size.width,
      height: this.config.size.height,
      x: this.config.position.x,
      y: this.config.position.y,
      frame: false,
      transparent: true,
      alwaysOnTop: this.config.settings?.isAlwaysOnTop ?? false,
      skipTaskbar: true,
      movable: true,
      resizable: true,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webviewTag: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        preload: WIDGET_WINDOW_PRELOAD_WEBPACK_ENTRY,
        // Allow iframes to load content
        webgl: true,
        images: true,
        javascript: true,
      },
    });
  }

  private setupWindow() {
    // Load the widget's URL with the widget ID as a query parameter
    this.window.loadURL(`${WIDGET_WINDOW_WEBPACK_ENTRY}?id=${this.config.id}`).catch(err => {
      console.error('Failed to load widget window:', err);
    });

    // Set opacity if specified
    if (this.config.settings?.opacity !== undefined) {
      this.window.setOpacity(this.config.settings.opacity);
    }

    // Handle window ready-to-show
    this.window.once('ready-to-show', () => {
      this.window.show();
    });

    // Handle window close
    this.window.on('closed', () => {
      this.dispose();
    });

    // Handle window move events
    this.window.on('move', () => {
      const [x, y] = this.window.getPosition();
      this.updateConfig({
        position: { x, y }
      });
    });

    // Handle window resize events
    this.window.on('resize', () => {
      const [width, height] = this.window.getSize();
      this.updateConfig({
        size: { width, height }
      });

      // Update BrowserView size if it exists
      if (this.browserView) {
        const bounds = this.window.getBounds();
        // Account for the header height (36px)
        this.browserView.setBounds({
          x: 0,
          y: 36,
          width: bounds.width,
          height: bounds.height - 36
        });
      }
    });

    // Add visibility change handler
    this.window.on('hide', () => {
      this.isVisible = false;
      this.handleVisibilityChange();
    });

    this.window.on('show', () => {
      this.isVisible = true;
      this.handleVisibilityChange();
    });

    // Add focus/blur handlers for throttling
    this.window.on('focus', () => {
      this.isThrottled = false;
      this.handleThrottlingChange();
    });

    this.window.on('blur', () => {
      this.isThrottled = true;
      this.handleThrottlingChange();
    });
  }

  private setupIPC() {
    // Use a unique channel name for each widget instance
    const configChannel = `widget:${this.config.id}:get-config`;
    
    // Handle widget:get-config request with unique channel
    ipcMain.handle(configChannel, () => {
      return this.config;
    });

    // Clean up IPC handlers when window is closed
    this.window.on('closed', () => {
      ipcMain.removeHandler(configChannel);
    });

    // Handle BrowserView creation
    ipcMain.on('browserView:create', (_, { id, url }) => {
      if (this.config.id === id) {
        this.createBrowserView(url);
      }
    });

    // Handle BrowserView bounds update
    ipcMain.on('browserView:setBounds', (_, { id, bounds }) => {
      if (this.config.id === id && this.browserView) {
        this.browserView.setBounds(bounds);
      }
    });

    // Handle BrowserView destruction
    ipcMain.on('browserView:destroy', (_, id) => {
      if (this.config.id === id) {
        this.destroyBrowserView();
      }
    });

    // Add metrics-related IPC handlers
    const metricsChannel = `widget:${this.config.id}:get-metrics`;
    ipcMain.handle(metricsChannel, async () => {
      try {
        return await this.collectResourceMetrics();
      } catch (error) {
        console.error('Error getting widget metrics:', error);
        return null;
      }
    });

    // Clean up IPC handlers when window is closed
    this.window.on('closed', () => {
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      ipcMain.removeHandler(metricsChannel);
    });
  }

  private createBrowserView(url: string) {
    // Destroy existing BrowserView if any
    this.destroyBrowserView();

    // Create new BrowserView
    this.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Add to window and load URL
    this.window.addBrowserView(this.browserView);
    
    // Set initial bounds
    const bounds = this.window.getBounds();
    this.browserView.setBounds({
      x: 0,
      y: 36, // Account for header height
      width: bounds.width,
      height: bounds.height - 36
    });

    // Load the URL
    this.browserView.webContents.loadURL(url).catch(err => {
      console.error('Failed to load URL in BrowserView:', err);
    });
  }

  private destroyBrowserView() {
    if (this.browserView) {
      this.window.removeBrowserView(this.browserView);
      this.browserView = null;
    }
  }

  public updateConfig(updates: Partial<WidgetConfig>) {
    try {
      // Update window properties
      if (updates.position) {
        this.window.setPosition(
          Math.round(updates.position.x),
          Math.round(updates.position.y)
        );
      }

      if (updates.size) {
        this.window.setSize(
          Math.round(updates.size.width),
          Math.round(updates.size.height)
        );
      }

      if (updates.settings?.isAlwaysOnTop !== undefined) {
        this.window.setAlwaysOnTop(updates.settings.isAlwaysOnTop);
      }

      if (updates.settings?.opacity !== undefined) {
        this.window.setOpacity(updates.settings.opacity);
      }

      // Update the stored config
      this.config = {
        ...this.config,
        ...updates,
        position: updates.position ? {
          x: Number(updates.position.x),
          y: Number(updates.position.y)
        } : this.config.position,
        size: updates.size ? {
          width: Number(updates.size.width),
          height: Number(updates.size.height)
        } : this.config.size,
        settings: {
          ...this.config.settings,
          ...updates.settings
        }
      };

      // Update BrowserView URL if changed
      if (updates.settings?.initialUrl && this.browserView) {
        this.browserView.webContents.loadURL(updates.settings.initialUrl).catch(err => {
          console.error('Failed to update BrowserView URL:', err);
        });
      }
    } catch (error) {
      console.error('Error updating widget config:', error);
      throw error;
    }
  }

  public getConfig(): WidgetConfig {
    return this.config;
  }

  private async collectResourceMetrics(): Promise<WidgetResourceMetrics> {
    try {
      // Get memory info using process API
      const memoryInfo = await this.window.webContents.executeJavaScript(`
        new Promise(resolve => {
          if (window.performance && performance.memory) {
            resolve({
              private: performance.memory.usedJSHeapSize
            });
          } else {
            resolve({
              private: 0
            });
          }
        });
      `);

      // Get CPU usage
      const cpuInfo = {
        percentCPUUsage: await this.window.webContents.executeJavaScript(`
          new Promise(resolve => {
            if (window.performance && performance.now) {
              const start = performance.now();
              const iterations = 1000000;
              for (let i = 0; i < iterations; i++) {
                Math.sqrt(i);
              }
              const end = performance.now();
              const duration = end - start;
              resolve((duration / 10) * (navigator.hardwareConcurrency || 1));
            } else {
              resolve(0);
            }
          });
        `)
      };

      // Get FPS using requestAnimationFrame
      const fpsStats = await this.window.webContents.executeJavaScript(`
        new Promise(resolve => {
          let frameCount = 0;
          let lastTime = performance.now();
          
          function countFrame() {
            const now = performance.now();
            frameCount++;
            
            if (now - lastTime >= 1000) {
              resolve(frameCount);
            } else {
              requestAnimationFrame(countFrame);
            }
          }
          
          requestAnimationFrame(countFrame);
        });
      `);

      // Get network request count
      const networkStats = await this.window.webContents.executeJavaScript(`
        new Promise(resolve => {
          const entries = performance.getEntriesByType('resource');
          resolve(entries.length);
        });
      `);

      return {
        widgetId: this.config.id,
        cpuUsage: Math.round(cpuInfo.percentCPUUsage),
        memoryUsage: memoryInfo.private,
        fps: Math.round(fpsStats),
        loadTime: Date.now() - this.startTime,
        networkRequests: networkStats,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error collecting metrics:', error);
      // Return default metrics with widgetId on error
      return {
        widgetId: this.config.id,
        cpuUsage: 0,
        memoryUsage: 0,
        fps: 0,
        loadTime: Date.now() - this.startTime,
        networkRequests: 0,
        lastUpdated: Date.now()
      };
    }
  }

  private startResourceMonitoring() {
    // Collect metrics every 5 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        if (!this.window.isDestroyed()) {
          const metrics = await this.collectResourceMetrics();
          
          // Update the config with new metrics
          this.config.resourceMetrics = metrics;

          // Emit metrics update event
          this.window.webContents.send('widget:metrics-update', metrics);

          // Log warning if resource usage is high
          if (metrics.cpuUsage > 80) {
            console.warn(`High CPU usage detected for widget ${this.config.id}: ${metrics.cpuUsage}%`);
          }
          if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
            console.warn(`High memory usage detected for widget ${this.config.id}: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
          }
        }
      } catch (error) {
        console.error('Error collecting resource metrics:', error);
      }
    }, 5000);

    // Start monitoring when window is ready
    this.window.once('ready-to-show', () => {
      this.startTime = Date.now();
    });
  }

  private startResourceThrottling() {
    this.resourceCheckInterval = setInterval(async () => {
      if (!this.isVisible || this.isThrottled) {
        const metrics = await this.collectResourceMetrics();
        if (!metrics) return;

        // Check CPU usage
        if (metrics.cpuUsage > BACKGROUND_CPU_LIMIT) {
          this.throttleCPU();
        }

        // Check memory usage
        if (metrics.memoryUsage > BACKGROUND_MEMORY_LIMIT) {
          this.throttleMemory();
        }
      }
    }, RESOURCE_CHECK_INTERVAL);
  }

  private throttleCPU() {
    if (this.browserView && this.browserView.webContents) {
      // Reduce frame rate and throttle background processes
      this.browserView.webContents.setFrameRate(5);
      this.browserView.webContents.setBackgroundThrottling(true);
    }
  }

  private throttleMemory() {
    if (this.browserView && this.browserView.webContents) {
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Clear cache and unused memory
      this.browserView.webContents.session.clearCache();
      this.browserView.webContents.session.clearStorageData({
        storages: ['cachestorage', 'shadercache', 'serviceworkers']
      });
    }
  }

  private handleVisibilityChange() {
    if (this.browserView && this.browserView.webContents) {
      if (!this.isVisible) {
        // Throttle background processes
        this.browserView.webContents.setBackgroundThrottling(true);
        this.browserView.webContents.audioMuted = true;
      } else {
        // Restore normal operation
        this.browserView.webContents.setBackgroundThrottling(false);
        this.browserView.webContents.audioMuted = false;
      }
    }
  }

  private handleThrottlingChange() {
    if (this.browserView && this.browserView.webContents) {
      if (this.isThrottled) {
        // Apply throttling for unfocused widgets
        this.browserView.webContents.setBackgroundThrottling(true);
        this.browserView.webContents.setFrameRate(10); // Reduce frame rate
      } else {
        // Restore normal operation
        this.browserView.webContents.setBackgroundThrottling(false);
        this.browserView.webContents.setFrameRate(60); // Restore frame rate
      }
    }
  }

  public dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.resourceCheckInterval) {
      clearInterval(this.resourceCheckInterval);
    }
    this.destroyBrowserView();
    try {
      if (!this.window.isDestroyed()) {
        this.window.destroy();
      }
    } catch (error) {
      console.error('Error disposing widget window:', error);
    }
  }
} 