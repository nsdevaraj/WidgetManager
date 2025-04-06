import { z } from 'zod';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type WidgetType = 'clock' | 'weather' | 'notes' | 'calendar' | 'url';

// Widget configuration schema
export const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['clock', 'weather', 'notes', 'calendar', 'url']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).strict(),
  size: z.object({
    width: z.number().min(50),
    height: z.number().min(50)
  }).strict(),
  isVisible: z.boolean().optional(),
  settings: z.object({
    isAlwaysOnTop: z.boolean().optional(),
    opacity: z.number().min(0.1).max(1).optional(),
    customCSS: z.string().optional(),
    initialUrl: z.string().optional(),
    zIndex: z.number().min(0).optional()
  }).optional(),
  resourceMetrics: z.object({
    cpuUsage: z.number().min(0).max(100),
    memoryUsage: z.number().min(0),
    fps: z.number().min(0),
    loadTime: z.number().min(0),
    networkRequests: z.number().min(0),
    lastUpdated: z.number().min(0)
  }).optional()
});

// Application settings schema
export const appSettingsSchema = z.object({
  defaultSize: z.object({
    width: z.number().min(50),
    height: z.number().min(50)
  }).strict(),
  gridSnapping: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  startupBehavior: z.enum(['restore', 'minimized']),
  startAtLogin: z.boolean(),
  widgetGroups: z.array(z.object({
    id: z.string(),
    name: z.string(),
    widgetIds: z.array(z.string()),
    isVisible: z.boolean(),
    createdAt: z.number(),
    updatedAt: z.number()
  })).optional()
}).strict();

// Store schema combining both widgets and settings
export const storeSchema = z.object({
  widgets: z.array(widgetConfigSchema),
  settings: appSettingsSchema
}).strict();

// TypeScript types derived from the schemas
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type StoreSchema = z.infer<typeof storeSchema>;

// Default values
export const defaultWidgetConfig: Partial<WidgetConfig> = {
  position: { x: 0, y: 0 },
  size: { width: 300, height: 200 },
  isVisible: true,
  settings: {
    isAlwaysOnTop: false,
    opacity: 1,
    initialUrl: 'https://widgets.cursor.sh/welcome.html',
    zIndex: 0
  }
};

export const defaultAppSettings: AppSettings = {
  defaultSize: {
    width: 300,
    height: 200
  },
  gridSnapping: true,
  theme: 'system',
  startupBehavior: 'restore',
  startAtLogin: true,
  widgetGroups: []
};

// Helper functions for validation
export const validateWidgetConfig = (config: unknown): WidgetConfig => {
  return widgetConfigSchema.parse(config);
};

export const validateAppSettings = (settings: unknown): AppSettings => {
  return appSettingsSchema.parse(settings);
};

export const validateStoreSchema = (store: unknown): StoreSchema => {
  return storeSchema.parse(store);
};

export interface WidgetGroup {
  id: string;
  name: string;
  widgetIds: string[];
  isVisible: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WidgetResourceMetrics {
  widgetId: string;  // ID of the widget these metrics belong to
  cpuUsage: number;  // CPU usage percentage
  memoryUsage: number;  // Memory usage in bytes
  fps: number;  // Frames per second
  loadTime: number;  // Initial load time in milliseconds
  networkRequests: number;  // Number of active network requests
  lastUpdated: number;  // Timestamp of last metrics update
} 