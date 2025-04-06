import React, { useState, useEffect, useCallback } from 'react';
import { Widget } from './Widget';
import { WidgetConfig, Size, Position } from '../../types/config';
import { Screen } from '../../types/electron';
import { constrainPosition, calculateInitialPosition } from '../utils/screen';
import './WidgetContainer.css';

export const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load initial widgets
    loadWidgets();

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

  const loadWidgets = async () => {
    try {
      const loadedWidgets = await window.api.listWidgets();
      setWidgets(loadedWidgets);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load widgets:', error);
      setErrorMessage('Failed to load widgets. Please try refreshing the page.');
    }
  };

  const handleWidgetDragEnd = async (id: string, position: Position) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    try {
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
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to update widget position:', error);
      setErrorMessage('Failed to save widget position. Changes may be lost on reload.');
      
      // Revert to last known good position
      setWidgets(prevWidgets =>
        prevWidgets.map(w => w.id === id ? widget : w)
      );
    }
  };

  const handlePositionChange = useCallback(async (id: string, position: Position) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    try {
      const size: Size = {
        width: widget.size.width || 300,
        height: widget.size.height || 200
      };

      const constrainedPosition = await constrainPosition(position, size);
      
      // Only update the widget in state during dragging
      setWidgets(prevWidgets =>
        prevWidgets.map(w => w.id === id ? { ...w, position: constrainedPosition } : w)
      );
    } catch (error) {
      console.error('Failed to update widget position during drag:', error);
    }
  }, [widgets]);

  const handleAddWidget = async () => {
    try {
      const size: Size = { width: 300, height: 200 };
      const initialPosition = await calculateInitialPosition(size);
      const newWidget = await window.api.addWidget({
        type: 'clock',
        position: initialPosition,
        size
      });
      setWidgets(prevWidgets => [...prevWidgets, newWidget]);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to add widget:', error);
      setErrorMessage('Failed to add new widget. Please try again.');
    }
  };

  return (
    <div className="widget-container">
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          config={widget}
          onDragEnd={(position) => handleWidgetDragEnd(widget.id, position)}
          onPositionChange={(position) => handlePositionChange(widget.id, position)}
        />
      ))}
      <button onClick={handleAddWidget}>Add Widget</button>
    </div>
  );
}; 