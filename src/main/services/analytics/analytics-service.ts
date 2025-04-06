import * as Sentry from '@sentry/electron';
import mixpanel from 'mixpanel-browser';
import { app } from 'electron';
import Store from 'electron-store';

interface AnalyticsStore {
    'analytics.enabled': boolean;
    'analytics.userId': string;
}

export class AnalyticsService {
    private store: Store<AnalyticsStore>;
    private isEnabled: boolean;
    private userId: string;

    constructor() {
        this.store = new Store<AnalyticsStore>({
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
        this.initializeMixpanel();
    }

    private generateUserId(): string {
        return `user_${Math.random().toString(36).substr(2, 9)}`;
    }

    private initializeSentry() {
        if (this.isEnabled && process.env.SENTRY_DSN) {
            Sentry.init({
                dsn: process.env.SENTRY_DSN,
                release: app.getVersion(),
                beforeSend(event) {
                    // Scrub any sensitive data if needed
                    return event;
                },
            });

            // Set user ID as a tag
            Sentry.configureScope(scope => {
                scope.setTag('userId', this.userId);
            });
        }
    }

    private initializeMixpanel() {
        if (this.isEnabled && process.env.MIXPANEL_TOKEN) {
            mixpanel.init(process.env.MIXPANEL_TOKEN, {
                debug: process.env.NODE_ENV === 'development',
            });
            
            mixpanel.identify(this.userId);
        }
    }

    public trackEvent(eventName: string, properties: Record<string, any> = {}) {
        if (this.isEnabled) {
            mixpanel.track(eventName, {
                ...properties,
                app_version: app.getVersion(),
                platform: process.platform,
            });
        }
    }

    public captureError(error: Error, context: Record<string, any> = {}) {
        if (this.isEnabled) {
            Sentry.configureScope(scope => {
                scope.setExtras({
                    ...context,
                    app_version: app.getVersion(),
                    platform: process.platform,
                });
                Sentry.captureException(error);
            });
        }
    }

    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        this.store.set('analytics.enabled', enabled);

        if (!enabled) {
            // Properly handle disabling analytics
            mixpanel.reset();
            // Note: Sentry doesn't need to be "closed" in the same way
        } else {
            this.initializeSentry();
            this.initializeMixpanel();
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