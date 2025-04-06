import { app } from 'electron';
const Store = require('electron-store');
import * as Sentry from '@sentry/electron/main';

interface AnalyticsStore {
    'analytics.enabled': boolean;
    'analytics.userId': string;
}

export class AnalyticsService {
    private store: any;
    private isEnabled: boolean;
    private userId: string;

    constructor() {
        this.store = new Store({
            defaults: {
                'analytics.enabled': true,
                'analytics.userId': '',
            }
        });
        this.isEnabled = this.store.get('analytics.enabled');
        this.userId = this.store.get('analytics.userId');
        
        if (!this.userId) {
            this.userId = this.generateUserId();
            this.store.set('analytics.userId', this.userId);
        }

        this.initializeSentry();
    }

    private generateUserId(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    private initializeSentry() {
        if (this.isEnabled && process.env.SENTRY_DSN) {
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                release: app.getVersion(),
                beforeSend(event: any) {
                    // Scrub any sensitive data if needed
                    return event;
                },
            });

            // Set user ID as a tag
            Sentry.setTag('userId', this.userId);
        }
    }

    public trackEvent(eventName: string, properties: Record<string, any> = {}) {
        if (this.isEnabled) {
            // TODO: Implement actual analytics tracking
            console.log('Tracking event:', eventName, properties);
        }
    }

    public captureError(error: Error, context: Record<string, any> = {}) {
        if (this.isEnabled) {
            Sentry.setExtras({
                ...context,
                app_version: app.getVersion(),
                platform: process.platform,
            });
            Sentry.captureException(error);
        }
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        this.store.set('analytics.enabled', enabled);

        if (!enabled) {
            // Properly handle disabling analytics
        }
    }

    public isAnalyticsEnabled(): boolean {
        return this.isEnabled;
    }

    public getUserId(): string {
        return this.userId;
    }
}

export const analyticsService = new AnalyticsService(); 