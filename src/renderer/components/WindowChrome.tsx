import React from 'react';
import { MinimizeIcon, MaximizeIcon, CloseIcon } from './icons';
import './WindowChrome.css';

interface WindowChromeProps {
  title?: string;
}

export const WindowChrome: React.FC<WindowChromeProps> = ({ title }) => {
  return (
    <div className="window-chrome">
      {title && <div className="window-title">{title}</div>}
      <div className="window-controls">
        <button
          className="window-control minimize"
          onClick={() => window.api.minimize()}
          title="Minimize"
        >
          <MinimizeIcon />
        </button>
        <button
          className="window-control maximize"
          onClick={() => window.api.maximize()}
          title="Maximize"
        >
          <MaximizeIcon />
        </button>
        <button
          className="window-control close"
          onClick={() => window.api.close()}
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}; 