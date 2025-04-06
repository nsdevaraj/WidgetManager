import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig, Position } from '../../types/config';
import './Widget.css';

interface WidgetProps {
  config: WidgetConfig;
  onDragEnd: (position: Position) => void;
}

export const Widget: React.FC<WidgetProps> = ({ config, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: config.position.x, y: config.position.y });
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x: config.position.x, y: config.position.y });
  }, [config.position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    };
    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    onDragEnd(position);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  return (
    <div
      ref={widgetRef}
      className="widget"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: config.size.width,
        height: config.size.height,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="widget-header">
        <div className="widget-title">{config.type}</div>
      </div>
      <div className="widget-content">
        {/* Widget content will be rendered here based on type */}
      </div>
    </div>
  );
}; 