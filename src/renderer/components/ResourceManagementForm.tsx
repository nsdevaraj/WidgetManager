import React from 'react';
import { AppSettings } from '../../types/config';
import './ResourceManagementForm.css';

interface ResourceManagementFormProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
}

export const ResourceManagementForm: React.FC<ResourceManagementFormProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleChange = (path: string[], value: any) => {
    const newSettings = { ...settings };
    let current = newSettings;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i] as keyof typeof current] as any;
    }
    current[path[path.length - 1] as keyof typeof current] = value;
    onSettingsChange(newSettings);
  };

  return (
    <div className="resource-management-form">
      <h3>Resource Management Settings</h3>
      
      <div className="settings-section">
        <h4>Background Widget Limits</h4>
        <div className="form-group">
          <label>CPU Usage Limit (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.resourceManagement.backgroundCpuLimit}
            onChange={(e) => handleChange(['resourceManagement', 'backgroundCpuLimit'], Number(e.target.value))}
          />
          <span className="help-text">Maximum CPU usage allowed for background widgets</span>
        </div>

        <div className="form-group">
          <label>Memory Limit (MB)</label>
          <input
            type="number"
            min="50"
            max="1000"
            value={settings.resourceManagement.backgroundMemoryLimit}
            onChange={(e) => handleChange(['resourceManagement', 'backgroundMemoryLimit'], Number(e.target.value))}
          />
          <span className="help-text">Maximum memory usage allowed for background widgets</span>
        </div>

        <div className="form-group">
          <label>Resource Check Interval (ms)</label>
          <input
            type="number"
            min="1000"
            max="60000"
            step="1000"
            value={settings.resourceManagement.resourceCheckInterval}
            onChange={(e) => handleChange(['resourceManagement', 'resourceCheckInterval'], Number(e.target.value))}
          />
          <span className="help-text">How often to check resource usage</span>
        </div>
      </div>

      <div className="settings-section">
        <h4>Throttling Settings</h4>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.resourceManagement.autoThrottleBackground}
              onChange={(e) => handleChange(['resourceManagement', 'autoThrottleBackground'], e.target.checked)}
            />
            Auto-throttle Background Widgets
          </label>
          <span className="help-text">Automatically reduce resource usage for background widgets</span>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.resourceManagement.enableMetricsLogging}
              onChange={(e) => handleChange(['resourceManagement', 'enableMetricsLogging'], e.target.checked)}
            />
            Enable Metrics Logging
          </label>
          <span className="help-text">Log resource usage metrics for analysis</span>
        </div>
      </div>

      <div className="settings-section">
        <h4>Throttle Thresholds</h4>
        <div className="form-group">
          <label>CPU Threshold (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.resourceManagement.throttleThresholds.cpu}
            onChange={(e) => handleChange(['resourceManagement', 'throttleThresholds', 'cpu'], Number(e.target.value))}
          />
          <span className="help-text">CPU usage that triggers throttling</span>
        </div>

        <div className="form-group">
          <label>Memory Threshold (MB)</label>
          <input
            type="number"
            min="50"
            max="1000"
            value={settings.resourceManagement.throttleThresholds.memory}
            onChange={(e) => handleChange(['resourceManagement', 'throttleThresholds', 'memory'], Number(e.target.value))}
          />
          <span className="help-text">Memory usage that triggers throttling</span>
        </div>

        <div className="form-group">
          <label>Network Requests Threshold</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={settings.resourceManagement.throttleThresholds.networkRequests}
            onChange={(e) => handleChange(['resourceManagement', 'throttleThresholds', 'networkRequests'], Number(e.target.value))}
          />
          <span className="help-text">Number of network requests that triggers throttling</span>
        </div>
      </div>

      <div className="settings-section">
        <h4>Throttle Behavior</h4>
        <div className="form-group">
          <label>Frame Rate When Throttled</label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.resourceManagement.throttleSettings.frameRate}
            onChange={(e) => handleChange(['resourceManagement', 'throttleSettings', 'frameRate'], Number(e.target.value))}
          />
          <span className="help-text">Frame rate to use when widget is throttled</span>
        </div>

        <div className="form-group">
          <label>Cache Clear Interval (ms)</label>
          <input
            type="number"
            min="1000"
            max="3600000"
            step="1000"
            value={settings.resourceManagement.throttleSettings.clearCacheInterval}
            onChange={(e) => handleChange(['resourceManagement', 'throttleSettings', 'clearCacheInterval'], Number(e.target.value))}
          />
          <span className="help-text">How often to clear cache for throttled widgets</span>
        </div>
      </div>
    </div>
  );
}; 