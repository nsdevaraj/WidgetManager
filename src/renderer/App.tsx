import React from 'react';
import { WindowChrome } from './components/WindowChrome';
import { Settings } from './components/Settings';
import { NotificationManager } from './components/NotificationManager';
import './index.css';

export const App: React.FC = () => {
  return (
    <div className="app">
      <WindowChrome />
      <Settings />
      <NotificationManager maxNotifications={3} />
    </div>
  );
}; 