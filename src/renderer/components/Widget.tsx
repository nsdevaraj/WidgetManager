import React, { useEffect, useState } from 'react';
import { WidgetConfig, Position } from '../../types/config';
import './Widget.css';

interface WidgetProps {
  config: WidgetConfig;
  onDragEnd?: (position: Position) => void;
  onPositionChange?: (position: Position) => void;
  standalone?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({ 
  config, 
  onDragEnd, 
  onPositionChange,
  standalone = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);

  useEffect(() => {
    if (standalone) {
      // In standalone mode, use window.api for drag operations
      const handleMouseDown = () => {
        window.api.onStartDrag();
      };

      const handleMouseMove = (e: MouseEvent) => {
        window.api.onMouseMove(e.screenX, e.screenY);
      };

      const handleMouseUp = () => {
        window.api.onMouseUp();
      };

      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [standalone]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (standalone) return; // Skip in standalone mode

    setIsDragging(true);
    setDragStart({
      x: e.clientX - config.position.x,
      y: e.clientY - config.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || standalone) return;

    const newPosition = {
      x: e.clientX - dragStart!.x,
      y: e.clientY - dragStart!.y
    };

    onPositionChange?.(newPosition);
  };

  const handleMouseUp = () => {
    if (!isDragging || standalone) return;

    setIsDragging(false);
    onDragEnd?.({
      x: config.position.x,
      y: config.position.y
    });
  };

  const style: React.CSSProperties = standalone ? {} : {
    position: 'absolute',
    left: config.position.x,
    top: config.position.y,
    width: config.size.width,
    height: config.size.height,
    opacity: config.settings?.opacity ?? 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  if (config.settings?.customCSS) {
    try {
      const customStyles = JSON.parse(config.settings.customCSS);
      Object.assign(style, customStyles);
    } catch (error) {
      console.error('Failed to parse custom CSS:', error);
    }
  }

  return (
    <div
      className={`widget ${config.type} ${isDragging ? 'dragging' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Widget content based on type */}
      {config.type === 'clock' && <div>Clock Widget</div>}
      {config.type === 'weather' && <div>Weather Widget</div>}
      {config.type === 'notes' && <div>Notes Widget</div>}
      {config.type === 'calendar' && <div>Calendar Widget</div>}
    </div>
  );
}; 