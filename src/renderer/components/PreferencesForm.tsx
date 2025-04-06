import React, { useState, useEffect } from 'react';
import { AppSettings, defaultAppSettings } from '../../types/config';
import './PreferencesForm.css';

interface PreferencesFormProps {
  initialSettings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  initialSettings,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [showGridPreview, setShowGridPreview] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
    setIsDirty(false);
  }, [initialSettings]);

  const handleChange = (
    key: keyof AppSettings,
    value: string | number | boolean
  ) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };
    setSettings(newSettings);
    setIsDirty(true);
    onSettingsChange(newSettings);
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    const newSettings = {
      ...settings,
      defaultSize: {
        ...settings.defaultSize,
        [dimension]: value,
      },
    };
    setSettings(newSettings);
    setIsDirty(true);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    setSettings(defaultAppSettings);
    setIsDirty(true);
    onSettingsChange(defaultAppSettings);
  };

  const handleExportConfig = async () => {
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }
      const config = await window.api.getSettings();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'widget-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export config:', error);
      // You might want to show this error in the UI
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.api) {
            throw new Error('Electron API not available');
          }
          const config = JSON.parse(e.target?.result as string);
          await window.api.updateSettings(config);
          // Reload settings after import
          const newSettings = await window.api.getSettings();
          setSettings(newSettings);
          onSettingsChange(newSettings);
        } catch (error) {
          console.error('Failed to import config:', error);
          // You might want to show this error in the UI
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Failed to read config file:', error);
      // You might want to show this error in the UI
    }
  };

  const GridPreview: React.FC = () => (
    <div className="grid-preview" style={{ display: showGridPreview ? 'block' : 'none' }}>
      <div className="grid-container">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid-row">
            {Array.from({ length: 6 }, (_, j) => (
              <div key={j} className="grid-cell">
                {i === 2 && j === 2 && (
                  <div className="widget-preview" style={{ opacity: settings.gridSnapping ? 1 : 0.5 }}>
                    Widget
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid-preview-label">
        Grid snapping {settings.gridSnapping ? 'enabled' : 'disabled'}
      </div>
    </div>
  );

  return (
    <div className="preferences-form">
      <div className="form-section">
        <h3>Theme</h3>
        <div className="form-group">
          <label>Application Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Widget Defaults</h3>
        <div className="form-group">
          <label>Default Width (px)</label>
          <input
            type="number"
            min="50"
            value={settings.defaultSize.width}
            onChange={(e) => handleSizeChange('width', parseInt(e.target.value, 10))}
          />
        </div>
        <div className="form-group">
          <label>Default Height (px)</label>
          <input
            type="number"
            min="50"
            value={settings.defaultSize.height}
            onChange={(e) => handleSizeChange('height', parseInt(e.target.value, 10))}
          />
        </div>
        <div className="form-group grid-snap-group"
          onMouseEnter={() => setShowGridPreview(true)}
          onMouseLeave={() => setShowGridPreview(false)}
        >
          <label>
            <input
              type="checkbox"
              checked={settings.gridSnapping}
              onChange={(e) => handleChange('gridSnapping', e.target.checked)}
            />
            Enable Grid Snapping
          </label>
          <GridPreview />
        </div>
      </div>

      <div className="form-section">
        <h3>Startup Options</h3>
        <div className="form-group">
          <label>Startup Behavior</label>
          <select
            value={settings.startupBehavior}
            onChange={(e) => handleChange('startupBehavior', e.target.value)}
          >
            <option value="restore">Restore Previous State</option>
            <option value="minimized">Start Minimized</option>
          </select>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.startAtLogin}
              onChange={(e) => handleChange('startAtLogin', e.target.checked)}
            />
            Start at Login
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Configuration</h3>
        <div className="form-group">
          <button
            className="export-button"
            onClick={handleExportConfig}
            type="button"
          >
            Export Configuration
          </button>
          <div className="import-container">
            <label htmlFor="import-config" className="import-button">
              Import Configuration
            </label>
            <input
              id="import-config"
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="reset-button"
          onClick={handleReset}
          type="button"
        >
          Reset to Defaults
        </button>
      </div>

      {isDirty && (
        <div className="preview-notice">
          Changes are applied in real-time. Your settings are automatically saved.
        </div>
      )}
    </div>
  );
}; 