import { z } from 'zod';

// Widget configuration schema
export const widgetConfigSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  name: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  size: z.object({
    width: z.number().min(50),
    height: z.number().min(50)
  }),
  isVisible: z.boolean(),
  settings: z.object({
    isAlwaysOnTop: z.boolean(),
    opacity: z.number().min(0.1).max(1),
    customCSS: z.string().optional()
  })
});

// Application settings schema
export const appSettingsSchema = z.object({
  defaultSize: z.object({
    width: z.number().min(50),
    height: z.number().min(50)
  }),
  gridSnapping: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  startupBehavior: z.enum(['restore', 'minimized']),
  startAtLogin: z.boolean()
});

// Store schema combining both widgets and settings
export const storeSchema = z.object({
  widgets: z.array(widgetConfigSchema),
  settings: appSettingsSchema
});

// TypeScript types derived from the schemas
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type StoreSchema = z.infer<typeof storeSchema>;

// Default values
export const defaultWidgetConfig: Omit<WidgetConfig, 'id' | 'url' | 'name'> = {
  position: { x: 0, y: 0 },
  size: { width: 300, height: 200 },
  isVisible: true,
  settings: {
    isAlwaysOnTop: false,
    opacity: 1
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
  startAtLogin: true
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