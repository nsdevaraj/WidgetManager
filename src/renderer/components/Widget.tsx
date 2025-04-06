import React, { useEffect, useState, useRef } from 'react';
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
  const dragState = useRef({ startX: 0, startY: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (standalone) {
      window.api.onStartDrag();
      return;
    }
    
    e.preventDefault();
    dragState.current = {
      startX: e.clientX - config.position.x,
      startY: e.clientY - config.position.y
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || standalone) return;

    const handleMouseMove = (e: MouseEvent) => {
      const position: Position = {
        x: e.clientX - dragState.current.startX,
        y: e.clientY - dragState.current.startY
      };
      onPositionChange?.(position);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.({ x: config.position.x, y: config.position.y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, standalone, config.position, onPositionChange, onDragEnd]);

  const style: React.CSSProperties = standalone ? {
    width: '100%',
    height: '100%',
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative'
  } : {
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
      className={`widget ${config.type} ${isDragging ? 'dragging' : ''} ${standalone ? 'standalone' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="widget-header" 
        onMouseDown={handleMouseDown}
      >
        <span className="widget-title">{config.type}</span>
      </div>
      <div className="widget-content">
        {config.type === 'clock' && <div>Clock Widget</div>}
        {config.type === 'weather' && <div>Weather Widget</div>}
        {config.type === 'notes' && <div>Notes Widget</div>}
        {config.type === 'calendar' && <div>Calendar Widget</div>}
      </div>
      {!standalone && (
        <div 
          className="widget-drag-handle" 
          onMouseDown={handleMouseDown}
          title="Drag to move"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 18h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2zm0-4h8V4H8v2z"/>
          </svg>
        </div>
      )}
    </div>
  );
}; 