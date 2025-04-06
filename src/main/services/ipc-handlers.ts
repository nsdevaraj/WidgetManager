import { ipcMain } from 'electron';
import { analyticsService } from './analytics/analytics-service';
import { onboardingService } from './onboarding/onboarding-service';
import { licenseService } from './licensing/license-service';

export function registerIpcHandlers() {
    // Onboarding handlers
    ipcMain.handle('onboarding:complete', () => {
        onboardingService.completeOnboarding();
    });

    ipcMain.handle('onboarding:skip', () => {
        onboardingService.skipOnboarding();
    });

    // Analytics handlers
    ipcMain.handle('analytics:getEnabled', () => {
        return analyticsService.isAnalyticsEnabled();
    });

    ipcMain.handle('analytics:setEnabled', (_, enabled: boolean) => {
        analyticsService.setEnabled(enabled);
    });

    // License handlers
    ipcMain.handle('license:getInfo', () => {
        return licenseService.getLicenseInfo();
    });

    ipcMain.handle('license:activate', (_, key: string, email: string) => {
        return licenseService.activateLicense(key, email);
    });

    ipcMain.handle('license:startTrial', (_, email: string) => {
        return licenseService.startTrial(email);
    });
} 