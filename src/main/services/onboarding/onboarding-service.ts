import { BrowserWindow, app } from 'electron';
const Store = require('electron-store');
const path = require('path');
import { analyticsService } from '../analytics/analytics-service';

declare const __dirname: string;

interface OnboardingStore {
    'onboarding.completed': boolean;
    'onboarding.skipped': boolean;
    'onboarding.lastVersion': string | null;
}

export class OnboardingService {
    private store: any;
    private onboardingWindow: BrowserWindow | null = null;

    constructor() {
        this.store = new Store({
            defaults: {
                'onboarding.completed': false,
                'onboarding.skipped': false,
                'onboarding.lastVersion': null,
            }
        });
    }

    public async checkAndShowOnboarding(): Promise<void> {
        const isFirstRun = !this.store.get('onboarding.completed');
        const lastVersion = this.store.get('onboarding.lastVersion');
        const currentVersion = app.getVersion();
        const isNewVersion = lastVersion !== currentVersion;

        if (isFirstRun || (isNewVersion && !this.store.get('onboarding.skipped'))) {
            analyticsService.trackEvent('onboarding_check', {
                is_first_run: isFirstRun,
                is_new_version: isNewVersion,
                current_version: currentVersion,
                last_version: lastVersion
            });

            this.showOnboarding();
        }
    }

    public shouldShowOnboarding(): boolean {
        return !this.store.get('onboarding.completed') && !this.store.get('onboarding.skipped');
    }

    public showOnboarding() {
        if (this.onboardingWindow) {
            this.onboardingWindow.focus();
            return;
        }

        this.onboardingWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
            show: false,
        });

        this.onboardingWindow.loadFile(path.join(__dirname, '../../renderer/onboarding.html'));

        this.onboardingWindow.once('ready-to-show', () => {
            if (this.onboardingWindow) {
                this.onboardingWindow.show();
                analyticsService.trackEvent('onboarding_shown');
            }
        });

        this.onboardingWindow.on('closed', () => {
            this.onboardingWindow = null;
        });
    }

    public completeOnboarding() {
        this.store.set('onboarding.completed', true);
        this.store.set('onboarding.lastVersion', app.getVersion());
        analyticsService.trackEvent('onboarding_completed');
        if (this.onboardingWindow) {
            this.onboardingWindow.close();
        }
    }

    public skipOnboarding() {
        this.store.set('onboarding.skipped', true);
        this.store.set('onboarding.lastVersion', app.getVersion());
        analyticsService.trackEvent('onboarding_skipped');
        if (this.onboardingWindow) {
            this.onboardingWindow.close();
        }
    }
}

export const onboardingService = new OnboardingService(); 