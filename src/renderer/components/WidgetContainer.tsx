import React, { useState, useEffect } from 'react';
import { Widget } from './Widget';
import { WidgetConfig, Size } from '../../types/config';
import { Screen } from '../../types/electron';
import { constrainPosition, calculateInitialPosition } from '../utils/screen';
import './WidgetContainer.css';

export const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);

  useEffect(() => {
    // Load initial widgets
    window.api.listWidgets().then(setWidgets);

    // Load screens
    window.api.getScreens().then(setScreens);

    // Listen for screen changes
    const handleScreenUpdate = () => {
      window.api.getScreens().then(setScreens);
    };

    window.addEventListener('resize', handleScreenUpdate);
    return () => {
      window.removeEventListener('resize', handleScreenUpdate);
    };
  }, []);

  const handleWidgetDragEnd = async (id: string, position: { x: number; y: number }) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const size: Size = {
      width: widget.size.width || 300,
      height: widget.size.height || 200
    };

    const constrainedPosition = await constrainPosition(position, size);
    
    // Update widget position
    const updatedWidget = await window.api.updateWidget(id, { position: constrainedPosition });
    
    // Update widget in state
    setWidgets(prevWidgets =>
      prevWidgets.map(w => w.id === id ? updatedWidget : w)
    );
  };

  const handleAddWidget = async () => {
    const size: Size = { width: 300, height: 200 };
    const initialPosition = await calculateInitialPosition(size);
    const newWidget = await window.api.addWidget({
      type: 'clock',
      position: initialPosition,
      size
    });
    setWidgets(prevWidgets => [...prevWidgets, newWidget]);
  };

  return (
    <div className="widget-container">
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          config={widget}
          onDragEnd={(position) => handleWidgetDragEnd(widget.id, position)}
        />
      ))}
      <button onClick={handleAddWidget}>Add Widget</button>
    </div>
  );
}; 