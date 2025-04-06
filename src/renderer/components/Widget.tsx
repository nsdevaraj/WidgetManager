import React, { useEffect, useRef, useState } from 'react';
import { WidgetConfig } from '../../types/config';
import './Widget.css';

interface WidgetProps {
  widget: WidgetConfig;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
}

const Widget: React.FC<WidgetProps> = ({ widget, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.screenX - dragOffsetRef.current.x;
      const newY = e.screenY - dragOffsetRef.current.y;

      // Update widget position
      if (widgetRef.current) {
        widgetRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }

      // Notify parent of position change
      onPositionChange(widget.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, widget.id, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragHandleRef.current) return;

    // Only start dragging from the drag handle
    if (!dragHandleRef.current.contains(e.target as Node)) return;

    const rect = widgetRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate offset from mouse position to widget corner
    dragOffsetRef.current = {
      x: e.screenX - rect.left,
      y: e.screenY - rect.top
    };

    setIsDragging(true);
  };

  return (
    <div
      ref={widgetRef}
      className={`widget ${isDragging ? 'dragging' : ''}`}
      style={{
        width: widget.size.width,
        height: widget.size.height,
        transform: `translate(${widget.position.x}px, ${widget.position.y}px)`,
        opacity: widget.settings.opacity,
        zIndex: isDragging ? 9999 : 'auto'
      }}
    >
      <div
        ref={dragHandleRef}
        className="widget-drag-handle"
        onMouseDown={handleMouseDown}
      >
        <span className="widget-title">{widget.name}</span>
        <div className="widget-controls">
          <button className="widget-control" onClick={() => {}}>
            ⚙️
          </button>
          <button className="widget-control" onClick={() => {}}>
            ✕
          </button>
        </div>
      </div>
      <webview
        src={widget.url}
        className="widget-content"
        style={{
          width: '100%',
          height: `calc(100% - 30px)` // Subtract header height
        }}
      />
    </div>
  );
};

export default Widget; 