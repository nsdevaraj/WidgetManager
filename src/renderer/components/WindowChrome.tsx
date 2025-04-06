import React from 'react';
import type { IElectronAPI } from '../../types/window';

const WindowChrome: React.FC = () => {
  return (
    <div className="window-chrome">
      <div className="window-chrome-drag-region" />
      <div className="window-chrome-controls">
        <button
          className="window-control minimize"
          onClick={() => window.api.minimizeWindow()}
          title="Minimize"
        >
          <MinimizeIcon />
        </button>
        <button
          className="window-control maximize"
          onClick={() => window.api.maximizeWindow()}
          title="Maximize"
        >
          <MaximizeIcon />
        </button>
        <button
          className="window-control close"
          onClick={() => window.api.closeWindow()}
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

const MinimizeIcon: React.FC = () => (
  <svg width="10" height="1" viewBox="0 0 10 1">
    <path d="M0 0h10v1H0z" fill="currentColor" />
  </svg>
);

const MaximizeIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <path d="M0 0v10h10V0H0zm1 1h8v8H1V1z" fill="currentColor" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10">
    <path
      d="M1.41 0L0 1.41 3.59 5 0 8.59 1.41 10l3.59-3.59 3.59 3.59 1.41-1.41L6.41 5 10 1.41 8.59 0 5 3.59 1.41 0z"
      fill="currentColor"
    />
  </svg>
);

export default WindowChrome; 