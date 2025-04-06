import React from 'react';
import { WindowChrome } from './components/WindowChrome';
import { Settings } from './components/Settings';
import './index.css';

export const App: React.FC = () => {
  return (
    <div className="app">
      <WindowChrome />
      <Settings />
    </div>
  );
}; 