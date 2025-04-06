import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig } from '../../types/config';
import './Widget.css';

interface WidgetProps {
  config: WidgetConfig;
  onDragEnd: (position: { x: number; y: number }) => void;
}

export const Widget: React.FC<WidgetProps> = ({ config, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(config.position);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(config.position);
  }, [config.position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      };
      setPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd(position);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  return (
    <div
      ref={widgetRef}
      className={`widget ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: config.size.width,
        height: config.size.height
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