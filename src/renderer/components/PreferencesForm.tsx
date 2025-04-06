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
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.gridSnapping}
              onChange={(e) => handleChange('gridSnapping', e.target.checked)}
            />
            Enable Grid Snapping
          </label>
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