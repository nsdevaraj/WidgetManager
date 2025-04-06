import React, { useEffect, useState } from 'react';
import { WidgetConfig, WidgetType } from '../../types/config';
import { ClockWidget } from './widgets/ClockWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { NotesWidget } from './widgets/NotesWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
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
      return <ClockWidget />;
    case 'weather':
      return <WeatherWidget />;
    case 'notes':
      return <NotesWidget />;
    case 'calendar':
      return <CalendarWidget />;
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