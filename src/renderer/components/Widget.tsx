import React, { useEffect, useState, useRef } from 'react';
import { WidgetConfig, Position } from '../../types/config';
import { WidgetContextMenu } from './WidgetContextMenu';
import './Widget.css';
import { ClockWidget } from './widgets/ClockWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { NotesWidget } from './widgets/NotesWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { WidgetMetrics } from './WidgetMetrics';
import '../styles/WidgetMetrics.css';

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
  const [showOpacityControl, setShowOpacityControl] = useState(false);
  const [showOpacityFeedback, setShowOpacityFeedback] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const opacityFeedbackTimer = useRef<NodeJS.Timeout>();
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleOpacityChange = (newOpacity: number) => {
    window.api.updateWidget(config.id, {
      settings: { ...config.settings, opacity: newOpacity }
    });

    // Show feedback
    setShowOpacityFeedback(true);
    if (opacityFeedbackTimer.current) {
      clearTimeout(opacityFeedbackTimer.current);
    }
    opacityFeedbackTimer.current = setTimeout(() => {
      setShowOpacityFeedback(false);
    }, 1500);
  };

  const handleToggleAlwaysOnTop = () => {
    window.api.updateWidget(config.id, {
      settings: {
        ...config.settings,
        isAlwaysOnTop: !(config.settings?.isAlwaysOnTop ?? false)
      }
    });
  };

  const handleZIndexChange = (change: number) => {
    window.api.updateWidget(config.id, {
      settings: {
        ...config.settings,
        zIndex: Math.max(0, (config.settings?.zIndex ?? 0) + change)
      }
    });
  };

  // Handle opacity keyboard shortcuts
  useEffect(() => {
    if (!standalone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        let newOpacity: number | null = null;

        switch (e.key) {
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            // Set opacity to key number / 10 (e.g., Alt+5 = 0.5)
            newOpacity = Number(e.key) / 10;
            break;
          case '0':
            // Alt+0 = full opacity
            newOpacity = 1;
            break;
          case '-':
            // Decrease opacity by 0.1
            newOpacity = Math.max(0.1, (config.settings?.opacity ?? 1) - 0.1);
            break;
          case '=':
            // Increase opacity by 0.1
            newOpacity = Math.min(1, (config.settings?.opacity ?? 1) + 0.1);
            break;
          case 't':
          case 'T':
            // Toggle always on top
            window.api.updateWidget(config.id, {
              settings: {
                ...config.settings,
                isAlwaysOnTop: !(config.settings?.isAlwaysOnTop ?? false)
              }
            });
            break;
          case '[':
            // Send backward
            window.api.updateWidget(config.id, {
              settings: {
                ...config.settings,
                zIndex: Math.max(0, (config.settings?.zIndex ?? 0) - 1)
              }
            });
            break;
          case ']':
            // Bring forward
            window.api.updateWidget(config.id, {
              settings: {
                ...config.settings,
                zIndex: (config.settings?.zIndex ?? 0) + 1
              }
            });
            break;
        }

        if (newOpacity !== null) {
          handleOpacityChange(newOpacity);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [standalone, config.id, config.settings]);

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
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: config.settings?.zIndex ?? 0
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
    <>
      <div
        ref={containerRef}
        className={`widget ${config.type} ${isDragging ? 'dragging' : ''} ${standalone ? 'standalone' : ''}`}
        style={style}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <div className="widget-header">
          <h3 className="widget-title">{config.type}</h3>
          <div className="widget-controls">
            <div 
              className="opacity-control-container"
              onMouseEnter={() => setShowOpacityControl(true)}
              onMouseLeave={() => setShowOpacityControl(false)}
            >
              <button className="opacity-button" title="Adjust Opacity">
                {Math.round((config.settings?.opacity ?? 1) * 100)}%
              </button>
              {showOpacityControl && (
                <div className="opacity-slider-container">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.settings?.opacity ?? 1}
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  />
                  <div className="opacity-presets">
                    {[0.2, 0.4, 0.6, 0.8, 1].map(value => (
                      <button
                        key={value}
                        className="opacity-preset"
                        onClick={() => handleOpacityChange(value)}
                      >
                        {value * 100}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button 
              className={`always-on-top-button ${config.settings?.isAlwaysOnTop ? 'active' : ''}`}
              onClick={handleToggleAlwaysOnTop}
              title={`${config.settings?.isAlwaysOnTop ? 'Disable' : 'Enable'} Always on Top (Alt + T)`}
            >
              📌
            </button>
            <div className="z-index-controls">
              <button 
                className="z-index-button"
                onClick={() => handleZIndexChange(1)}
                title="Bring Forward (Alt + ])"
              >
                ⬆️
              </button>
              <button 
                className="z-index-button"
                onClick={() => handleZIndexChange(-1)}
                title="Send Backward (Alt + [)"
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>
        {showOpacityFeedback && (
          <div className="opacity-feedback">
            Opacity: {Math.round((config.settings?.opacity ?? 1) * 100)}%
          </div>
        )}
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
      {showContextMenu && (
        <WidgetContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onClose={handleCloseContextMenu}
          onOpacityChange={handleOpacityChange}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onZIndexChange={handleZIndexChange}
          currentOpacity={config.settings?.opacity ?? 1}
          isAlwaysOnTop={config.settings?.isAlwaysOnTop ?? false}
          currentZIndex={config.settings?.zIndex ?? 0}
        />
      )}
      <WidgetMetrics widgetId={config.id} />
    </>
  );
}; 