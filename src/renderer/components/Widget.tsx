import React, { useEffect, useState, useRef } from 'react';
import { WidgetConfig, Position } from '../../types/config';
import './Widget.css';
import { ClockWidget } from './widgets/ClockWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { NotesWidget } from './widgets/NotesWidget';
import { CalendarWidget } from './widgets/CalendarWidget';

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
  const currentPosition = useRef({ x: config.position.x, y: config.position.y });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (config.type === 'url' && containerRef.current) {
      // Create BrowserView when component mounts
      window.api.createBrowserView(config.id, config.settings?.initialUrl || 'about:blank');

      // Cleanup BrowserView when component unmounts
      return () => {
        window.api.destroyBrowserView(config.id);
      };
    }
  }, [config.type, config.id]);

  useEffect(() => {
    if (config.type === 'url' && containerRef.current) {
      // Update BrowserView bounds when container size/position changes
      const rect = containerRef.current.getBoundingClientRect();
      window.api.setBrowserViewBounds(config.id, {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }
  }, [config.position.x, config.position.y, config.size.width, config.size.height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (standalone) {
      e.preventDefault();
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY
      };
      currentPosition.current = { x: config.position.x, y: config.position.y };
      window.api.onStartDrag();
      setIsDragging(true);
      return;
    }
    
    e.preventDefault();
    dragState.current = {
      startX: e.clientX - config.position.x,
      startY: e.clientY - config.position.y
    };
    currentPosition.current = { x: config.position.x, y: config.position.y };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (standalone) {
        const deltaX = e.clientX - dragState.current.startX;
        const deltaY = e.clientY - dragState.current.startY;
        const newPosition = {
          x: currentPosition.current.x + deltaX,
          y: currentPosition.current.y + deltaY
        };
        window.api.onMouseMove(newPosition.x, newPosition.y);
        return;
      }

      const position: Position = {
        x: e.clientX - dragState.current.startX,
        y: e.clientY - dragState.current.startY
      };
      currentPosition.current = position;
      onPositionChange?.(position);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (standalone) {
        window.api.onMouseUp();
      } else {
        onDragEnd?.(currentPosition.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, standalone, onPositionChange, onDragEnd]);

  // Handle window resize for standalone widgets
  useEffect(() => {
    if (!standalone) return;

    const handleResize = () => {
      // Update widget size based on window size
      const size = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Update BrowserView bounds if this is a URL widget
      if (config.type === 'url' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        window.api.setBrowserViewBounds(config.id, {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial size update
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [standalone, config.type, config.id]);

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
        {config.type === 'clock' && <ClockWidget />}
        {config.type === 'weather' && <WeatherWidget />}
        {config.type === 'notes' && <NotesWidget />}
        {config.type === 'calendar' && <CalendarWidget />}
        {config.type === 'url' && (
          <div 
            ref={containerRef}
            style={{
              width: '100%',
              height: 'calc(100% - 36px)', // Subtract header height
              borderRadius: '0 0 8px 8px'
            }}
          />
        )}
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