import React, { useState, useEffect } from 'react';
import './Settings.css';
import { WindowChrome } from './WindowChrome';
import { WidgetManager } from './WidgetManager';
import { PreferencesForm } from './PreferencesForm';
import { AppSettings, defaultAppSettings } from '../../types/config';

type SettingsTab = 'widgets' | 'preferences';

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

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('widgets');
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // Check if window.electron exists
        if (!window.electron) {
          throw new Error('Electron API not available');
        }
        const settings = await window.electron.invoke('settings:get');
        setAppSettings(settings);
        setError(null);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingsChange = async (newSettings: AppSettings) => {
    try {
      if (!window.electron) {
        throw new Error('Electron API not available');
      }
      await window.electron.invoke('settings:update', newSettings);
      setAppSettings(newSettings);
      setError(null);
    } catch (err) {
      console.error('Failed to update settings:', err);
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
    <div className="settings-window">
      <WindowChrome title="Settings" />
      {error && (
        <ErrorNotification 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}
      <div className="settings-container">
        <nav className="settings-nav">
          <button
            className={`nav-button ${activeTab === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('widgets')}
          >
            Widgets
          </button>
          <button
            className={`nav-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </nav>
        
        <main className="settings-content">
          {activeTab === 'widgets' && (
            <div className="widgets-section">
              <h2>Widget Management</h2>
              <WidgetManager />
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="preferences-section">
              <h2>Application Preferences</h2>
              <PreferencesForm
                initialSettings={appSettings}
                onSettingsChange={handleSettingsChange}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}; 