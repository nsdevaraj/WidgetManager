import React, { useEffect, useState } from 'react';
import { Widget } from './Widget';
import { WidgetConfig } from '../../types/config';
import { Screen } from '../../types/window';
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
    return () => window.removeEventListener('resize', handleScreenUpdate);
  }, []);

  const handleDragEnd = async (id: string, position: { x: number; y: number }) => {
    // Constrain the position to screen bounds
    const constrainedPosition = constrainPosition(position, { width: 300, height: 200 }, screens);
    
    // Update widget position
    await window.api.updateWidget(id, { position: constrainedPosition });
    
    // Refresh widget list
    const updatedWidgets = await window.api.listWidgets();
    setWidgets(updatedWidgets);
  };

  const handleAddWidget = async () => {
    const initialPosition = calculateInitialPosition({ width: 300, height: 200 });
    await window.api.addWidget({
      type: 'clock',
      position: initialPosition,
      size: { width: 300, height: 200 }
    });

    // Refresh widget list
    const updatedWidgets = await window.api.listWidgets();
    setWidgets(updatedWidgets);
  };

  return (
    <div className="widget-container">
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          config={widget}
          onDragEnd={(position) => handleDragEnd(widget.id, position)}
        />
      ))}
    </div>
  );
}; 