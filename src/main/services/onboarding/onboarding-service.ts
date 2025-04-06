import { BrowserWindow, app } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { analyticsService } from '../analytics/analytics-service';

interface OnboardingStore {
    'onboarding.completed': boolean;
    'onboarding.lastVersion': string;
}

export class OnboardingService {
    private store: Store<OnboardingStore>;
    private onboardingWindow: BrowserWindow | null = null;

    constructor() {
        this.store = new Store<OnboardingStore>({
            defaults: {
                'onboarding.completed': false,
                'onboarding.lastVersion': '',
            }
        });
    }

    public async checkAndShowOnboarding() {
        const isFirstRun = !this.store.get('onboarding.completed');
        const lastVersion = this.store.get('onboarding.lastVersion');
        const currentVersion = app.getVersion();
        const isNewVersion = lastVersion !== currentVersion;

        if (isFirstRun || isNewVersion) {
            analyticsService.trackEvent('onboarding_started', {
                is_first_run: isFirstRun,
                is_new_version: isNewVersion,
                previous_version: lastVersion,
                current_version: currentVersion,
            });

            await this.showOnboardingWindow();
        }
    }

    private async showOnboardingWindow() {
        if (this.onboardingWindow) {
            this.onboardingWindow.focus();
            return;
        }

        this.onboardingWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'onboarding-preload.js'),
            },
            frame: false,
            transparent: true,
            resizable: false,
            center: true,
            show: false,
        });

        // Load the onboarding HTML file
        await this.onboardingWindow.loadFile(path.join(__dirname, 'onboarding.html'));

        this.onboardingWindow.once('ready-to-show', () => {
            if (this.onboardingWindow) {
                this.onboardingWindow.show();
            }
        });

        this.onboardingWindow.on('closed', () => {
            this.onboardingWindow = null;
        });
    }

    public completeOnboarding() {
        const currentVersion = app.getVersion();
        this.store.set('onboarding.completed', true);
        this.store.set('onboarding.lastVersion', currentVersion);

        analyticsService.trackEvent('onboarding_completed', {
            version: currentVersion,
        });

        if (this.onboardingWindow) {
            this.onboardingWindow.close();
            this.onboardingWindow = null;
        }
    }

    public skipOnboarding() {
        const currentVersion = app.getVersion();
        this.store.set('onboarding.completed', true);
        this.store.set('onboarding.lastVersion', currentVersion);

        analyticsService.trackEvent('onboarding_skipped', {
            version: currentVersion,
        });

        if (this.onboardingWindow) {
            this.onboardingWindow.close();
            this.onboardingWindow = null;
        }
    }
}

export const onboardingService = new OnboardingService(); 