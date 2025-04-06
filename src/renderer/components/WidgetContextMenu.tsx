import React, { useEffect, useRef } from 'react';
import './WidgetContextMenu.css';

interface WidgetContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpacityChange: (opacity: number) => void;
  onToggleAlwaysOnTop: () => void;
  onZIndexChange: (change: number) => void;
  currentOpacity: number;
  isAlwaysOnTop: boolean;
  currentZIndex: number;
}

export const WidgetContextMenu: React.FC<WidgetContextMenuProps> = ({
  x,
  y,
  onClose,
  onOpacityChange,
  onToggleAlwaysOnTop,
  onZIndexChange,
  currentOpacity,
  isAlwaysOnTop,
  currentZIndex
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 10000
  };

  return (
    <div ref={menuRef} className="widget-context-menu" style={style}>
      <div className="menu-section">
        <div className="menu-header">Opacity</div>
        <div className="menu-item-group">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={currentOpacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
          />
          <div className="opacity-presets">
            {[0.2, 0.4, 0.6, 0.8, 1].map(value => (
              <button
                key={value}
                className="opacity-preset"
                onClick={() => onOpacityChange(value)}
              >
                {value * 100}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-header">Layer Controls</div>
        <div className="menu-item" onClick={() => onZIndexChange(1)}>
          <span>Bring Forward</span>
          <span className="shortcut">Alt + ]</span>
        </div>
        <div className="menu-item" onClick={() => onZIndexChange(-1)}>
          <span>Send Backward</span>
          <span className="shortcut">Alt + [</span>
        </div>
        <div className="menu-item" onClick={onToggleAlwaysOnTop}>
          <span>Always on Top</span>
          <span className="shortcut">Alt + T</span>
          {isAlwaysOnTop && <span className="active-indicator">✓</span>}
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-header">Quick Opacity</div>
        <div className="menu-item-group quick-opacity">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <div
              key={num}
              className="menu-item"
              onClick={() => onOpacityChange(num / 10)}
            >
              <span>{num}0%</span>
              <span className="shortcut">Alt + {num}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="menu-section info">
        <div className="menu-item">
          <span>Current Z-Index: {currentZIndex}</span>
        </div>
        <div className="menu-item">
          <span>Current Opacity: {Math.round(currentOpacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}; 