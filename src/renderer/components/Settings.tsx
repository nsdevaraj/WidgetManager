import React, { useState } from 'react';
import './Settings.css';
import { WindowChrome } from './WindowChrome';

type SettingsTab = 'widgets' | 'preferences';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('widgets');

  return (
    <div className="settings-window">
      <WindowChrome title="Settings" />
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
              <div className="widget-list">
                {/* Widget list will be implemented in subtask 5.2 */}
                <p className="placeholder-text">Widget list coming soon...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="preferences-section">
              <h2>Application Preferences</h2>
              <div className="preferences-form">
                {/* Preferences form will be implemented in subtask 5.3 */}
                <p className="placeholder-text">Preferences form coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}; 