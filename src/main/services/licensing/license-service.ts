import { app } from 'electron';
import Store from 'electron-store';
import crypto from 'crypto';
import { analyticsService } from '../analytics/analytics-service';

interface LicenseStore {
    'license.key': string | null;
    'license.email': string | null;
    'license.type': 'trial' | 'pro' | null;
    'license.expiryDate': string | null;
}

interface LicenseInfo {
    type: 'trial' | 'pro' | null;
    email: string | null;
    expiryDate: Date | null;
    daysRemaining: number | null;
    isValid: boolean;
}

export class LicenseService {
    private store: Store<LicenseStore>;
    private readonly TRIAL_PERIOD_DAYS = 14;

    constructor() {
        this.store = new Store<LicenseStore>({
            defaults: {
                'license.key': null,
                'license.email': null,
                'license.type': null,
                'license.expiryDate': null
            }
        });
    }

    public async activateLicense(licenseKey: string, email: string): Promise<boolean> {
        try {
            // TODO: Implement check with your license server
            const isValid = true; // Replace with actual validation

            if (isValid) {
                this.store.set('license.key', licenseKey);
                this.store.set('license.email', email);
                this.store.set('license.type', 'pro'); // Or whatever type the server returns
                this.store.set('license.expiryDate', null); // Or expiry date from server

                analyticsService.trackEvent('license_activated', {
                    type: 'pro',
                    email: email
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error activating license:', error);
            analyticsService.captureError(error as Error);
            return false;
        }
    }

    public async startTrial(email: string): Promise<boolean> {
        try {
            if (await this.hasTrialBeenUsed(email)) {
                return false;
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + this.TRIAL_PERIOD_DAYS);

            this.store.set('license.email', email);
            this.store.set('license.type', 'trial');
            this.store.set('license.expiryDate', expiryDate.toISOString());

            analyticsService.trackEvent('trial_started', {
                email: email,
                expiryDate: expiryDate
            });

            return true;
        } catch (error) {
            console.error('Error starting trial:', error);
            analyticsService.captureError(error as Error);
            return false;
        }
    }

    public async getLicenseInfo(): Promise<LicenseInfo> {
        const licenseType = this.store.get('license.type');
        const email = this.store.get('license.email');
        const expiryDateStr = this.store.get('license.expiryDate');
        const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

        let daysRemaining: number | null = null;
        let isValid = false;

        if (expiryDate) {
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isValid = daysRemaining > 0;
        } else if (licenseType === 'pro') {
            isValid = true;
        }

        return {
            type: licenseType,
            email,
            expiryDate,
            daysRemaining,
            isValid
        };
    }

    private async validateCurrentLicense(): Promise<boolean> {
        const licenseType = this.store.get('license.type');
        const expiryDateStr = this.store.get('license.expiryDate');

        if (!licenseType) return false;

        if (licenseType === 'trial') {
            if (!expiryDateStr) return false;

            const expiryDate = new Date(expiryDateStr);
            const now = new Date();
            return expiryDate > now;
        }

        if (licenseType === 'pro') {
            const licenseKey = this.store.get('license.key');
            const email = this.store.get('license.email');

            if (!licenseKey || !email) return false;

            // TODO: Implement check with your license server
            return true;
        }

        return false;
    }

    private async hasTrialBeenUsed(email: string): Promise<boolean> {
        // TODO: Implement check with your license server
        // For now, we'll just check local storage
        const storedEmail = this.store.get('license.email');
        const licenseType = this.store.get('license.type');
        return storedEmail === email && licenseType === 'trial';
    }

    private hashLicenseKey(licenseKey: string): string {
        return crypto
            .createHash('sha256')
            .update(licenseKey)
            .digest('hex');
    }
}

export const licenseService = new LicenseService(); 