import React, { useEffect, useState } from 'react';
import { WidgetConfig } from '../../types/config';
import Widget from './Widget';
import './WidgetContainer.css';

const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    // Load widgets on mount
    window.api.listWidgets().then(setWidgets);
  }, []);

  const handlePositionChange = async (id: string, position: { x: number; y: number }) => {
    // Update widget position in state
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === id ? { ...widget, position } : widget
      )
    );

    // Persist position change
    await window.api.updateWidget(id, { position });
  };

  return (
    <div className="widget-container">
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          widget={widget}
          onPositionChange={handlePositionChange}
        />
      ))}
    </div>
  );
};

export default WidgetContainer; 