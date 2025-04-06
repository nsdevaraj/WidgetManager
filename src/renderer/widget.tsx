import React from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './components/Widget';
import './index.css';

// Get widget configuration from the window
const widgetConfig = (window as any).widgetConfig;

const WidgetApp: React.FC = () => {
  return (
    <div className="widget-window">
      <Widget config={widgetConfig} />
    </div>
  );
};

const container = document.getElementById('widget-root');
if (container) {
  const root = createRoot(container);
  root.render(<WidgetApp />);
} 