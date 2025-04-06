import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WidgetConfig, Position } from '../../types/config';
import './Widget.css';

interface WidgetProps {
  config: WidgetConfig;
  onDragEnd: (position: Position) => void;
  onPositionChange?: (position: Position) => void;
}

export const Widget: React.FC<WidgetProps> = ({ config, onDragEnd, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: config.position.x, y: config.position.y });
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const positionRef = useRef<Position>(position);

  // Update position ref when position changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Update position when config changes
  useEffect(() => {
    setPosition({ x: config.position.x, y: config.position.y });
  }, [config.position]);

  // Debounced position update
  const debouncedPositionUpdate = useCallback((newPosition: Position) => {
    const now = Date.now();
    if (now - lastUpdateRef.current > 50) { // 50ms debounce
      lastUpdateRef.current = now;
      onPositionChange?.(newPosition);
    }
  }, [onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    
    try {
      setIsDragging(true);
      const rect = widgetRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    } catch (error) {
      console.error('Error starting drag:', error);
      setIsDragging(false);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    try {
      const newPosition = {
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      };

      // Ensure position is within reasonable bounds
      if (Math.abs(newPosition.x) > 10000 || Math.abs(newPosition.y) > 10000) {
        console.warn('Position out of bounds, ignoring update');
        return;
      }

      setPosition(newPosition);
      debouncedPositionUpdate(newPosition);
    } catch (error) {
      console.error('Error during drag:', error);
      setIsDragging(false);
    }
  }, [isDragging, debouncedPositionUpdate]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    try {
      setIsDragging(false);
      onDragEnd(positionRef.current);
    } catch (error) {
      console.error('Error ending drag:', error);
    }
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={widgetRef}
      className={`widget ${isDragging ? 'dragging' : ''}`}
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