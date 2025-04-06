import { app } from 'electron';
import Store from 'electron-store';
import crypto from 'crypto';
import { analyticsService } from '../analytics/analytics-service';

interface LicenseStore {
    'license.key': string;
    'license.email': string;
    'license.expiryDate': string | null;
    'license.type': 'trial' | 'basic' | 'pro' | null;
}

interface LicenseInfo {
    isValid: boolean;
    type: 'trial' | 'basic' | 'pro' | null;
    email: string;
    expiryDate: Date | null;
    daysRemaining: number | null;
}

export class LicenseService {
    private store: Store<LicenseStore>;
    private readonly TRIAL_PERIOD_DAYS = 14;

    constructor() {
        this.store = new Store<LicenseStore>({
            defaults: {
                'license.key': '',
                'license.email': '',
                'license.expiryDate': null,
                'license.type': null,
            }
        });
    }

    public async activateLicense(licenseKey: string, email: string): Promise<boolean> {
        try {
            // Here you would typically make an API call to your license server
            // to validate the license key. For now, we'll use a simple hash check
            const isValid = await this.validateLicenseWithServer(licenseKey, email);

            if (isValid) {
                this.store.set('license.key', licenseKey);
                this.store.set('license.email', email);
                this.store.set('license.type', 'pro'); // Or whatever type the server returns
                this.store.set('license.expiryDate', null); // Or expiry date from server

                analyticsService.trackEvent('license_activated', {
                    type: 'pro',
                    email: email,
                });

                return true;
            }

            analyticsService.trackEvent('license_activation_failed', {
                error: 'Invalid license key',
                email: email,
            });

            return false;
        } catch (error) {
            analyticsService.captureError(error as Error, {
                context: 'license_activation',
                license_key: this.hashLicenseKey(licenseKey),
                email: email,
            });
            return false;
        }
    }

    public async startTrial(email: string): Promise<boolean> {
        if (await this.hasTrialBeenUsed(email)) {
            analyticsService.trackEvent('trial_start_failed', {
                reason: 'Trial already used',
                email: email,
            });
            return false;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.TRIAL_PERIOD_DAYS);

        this.store.set('license.email', email);
        this.store.set('license.type', 'trial');
        this.store.set('license.expiryDate', expiryDate.toISOString());

        analyticsService.trackEvent('trial_started', {
            email: email,
            expiry_date: expiryDate,
        });

        return true;
    }

    public async getLicenseInfo(): Promise<LicenseInfo> {
        const licenseType = this.store.get('license.type');
        const email = this.store.get('license.email');
        const expiryDateStr = this.store.get('license.expiryDate');
        const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

        let daysRemaining: number | null = null;
        if (expiryDate) {
            const now = new Date();
            daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        const isValid = await this.validateCurrentLicense();

        return {
            isValid,
            type: licenseType,
            email,
            expiryDate,
            daysRemaining,
        };
    }

    private async validateCurrentLicense(): Promise<boolean> {
        const licenseType = this.store.get('license.type');
        const expiryDateStr = this.store.get('license.expiryDate');

        if (!licenseType) return false;

        if (licenseType === 'trial') {
            if (!expiryDateStr) return false;
            const expiryDate = new Date(expiryDateStr);
            return expiryDate > new Date();
        }

        const licenseKey = this.store.get('license.key');
        const email = this.store.get('license.email');

        if (!licenseKey || !email) return false;

        // Here you would typically validate with your license server
        return this.validateLicenseWithServer(licenseKey, email);
    }

    private async validateLicenseWithServer(licenseKey: string, email: string): Promise<boolean> {
        // TODO: Implement actual license validation with your license server
        // For now, we'll just do a simple check
        const hash = this.hashLicenseKey(licenseKey);
        return hash.startsWith('valid');
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