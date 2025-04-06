import React, { useEffect, useState } from 'react';
import { WidgetConfig, WidgetType } from '../../types/config';
import './WidgetPreview.css';

interface WidgetPreviewProps {
  type: WidgetType;
  size: { width: number; height: number };
  settings: {
    isAlwaysOnTop: boolean;
    opacity: number;
    customCSS: string;
    initialUrl?: string;
  };
}

const getWidgetPreviewContent = (type: WidgetType, settings: WidgetPreviewProps['settings']) => {
  switch (type) {
    case 'clock':
      return (
        <div className="clock-preview">
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      );
    case 'weather':
      return (
        <div className="weather-preview">
          <span>🌤️</span>
          <span>72°F</span>
          <span>Sunny</span>
        </div>
      );
    case 'notes':
      return (
        <div className="notes-preview">
          <div className="note-header">Quick Notes</div>
          <div className="note-content">Type your notes here...</div>
        </div>
      );
    case 'calendar':
      return (
        <div className="calendar-preview">
          <div className="calendar-header">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className={`calendar-day ${i + 1 === new Date().getDate() ? 'today' : ''}`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );
    case 'url':
      return (
        <div className="url-preview">
          <div className="url-placeholder">
            <span>🌐</span>
            <span>URL widgets can only be previewed when launched</span>
            {settings.initialUrl && (
              <span className="url-preview-target">Target: {settings.initialUrl}</span>
            )}
          </div>
        </div>
      );
    default:
      return <div>Unsupported widget type</div>;
  }
};

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({ type, size, settings }) => {
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Parse custom CSS if provided
    let customStyles = {};
    if (settings.customCSS) {
      try {
        customStyles = JSON.parse(settings.customCSS);
      } catch (error) {
        console.error('Failed to parse custom CSS:', error);
      }
    }

    // Combine all styles
    setPreviewStyle({
      width: size.width,
      height: size.height,
      opacity: settings.opacity,
      ...customStyles,
    });
  }, [size, settings]);

  return (
    <div className="widget-preview-container">
      <div className="widget-preview-header">
        <span>Preview</span>
        <span className="preview-size">{size.width}×{size.height}</span>
      </div>
      <div className="widget-preview-frame" style={previewStyle}>
        {getWidgetPreviewContent(type, settings)}
      </div>
      <div className="widget-preview-footer">
        <div className="preview-settings">
          <span>{settings.isAlwaysOnTop ? '📌 Always on Top' : ''}</span>
          <span>Opacity: {Math.round(settings.opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}; 