import React, { useState, useEffect } from 'react';
import './Settings.css';
import { WindowChrome } from './WindowChrome';
import { WidgetManager } from './WidgetManager';
import { PreferencesForm } from './PreferencesForm';
import { ResourceManagementForm } from './ResourceManagementForm';
import { AppSettings, defaultAppSettings } from '../../types/config';
import { ElectronAPI } from '../../types/electron';

type SettingsTab = 'widgets' | 'preferences' | 'resources';

interface ErrorNotificationProps {
  message: string;
  onDismiss: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, onDismiss }) => (
  <div className="error-notification">
    <span>{message}</span>
    <button onClick={onDismiss}>&times;</button>
  </div>
);

function isElectronAPI(api: any): api is ElectronAPI {
  return api && 
    typeof api.invoke === 'function' && 
    typeof api.on === 'function' && 
    typeof api.off === 'function';
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('widgets');
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const api = window.api;
    if (!isElectronAPI(api)) {
      setError('Electron API not available');
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await api.invoke('settings:get');
        setSettings(settings as AppSettings);
        setError(null);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    const handleThemeChange = (_: any, theme: AppSettings['theme']) => {
      setSettings((prev) => ({ ...prev, theme }));
    };

    api.on('theme-changed', handleThemeChange);

    return () => {
      api.off('theme-changed', handleThemeChange);
    };
  }, []);

  const handleSettingsChange = async (newSettings: Partial<AppSettings>) => {
    const api = window.api;
    if (!isElectronAPI(api)) {
      setError('Electron API not available');
      return;
    }

    try {
      const updatedSettings = await api.invoke('settings:update', newSettings);
      setSettings(updatedSettings as AppSettings);
      setError(null);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError('Failed to save settings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="settings-window">
        <WindowChrome title="Settings" />
        <div className="settings-loading">
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('widgets')}
          >
            Widgets
          </button>
          <button
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resource Management
          </button>
        </div>
      </div>

      <div className="settings-content">
        {error && <div className="error-message">{error}</div>}
        {isLoading ? (
          <div className="loading">Loading settings...</div>
        ) : (
          <>
            {activeTab === 'preferences' && (
              <div className="preferences-section">
                <h2>Application Preferences</h2>
                <PreferencesForm
                  initialSettings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              </div>
            )}
            {activeTab === 'widgets' && (
              <div className="widgets-section">
                <h2>Widget Management</h2>
                <WidgetManager />
              </div>
            )}
            {activeTab === 'resources' && (
              <div className="resources-section">
                <h2>Resource Management</h2>
                <ResourceManagementForm
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 