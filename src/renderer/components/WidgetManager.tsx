import React, { useState, useEffect } from 'react';
import { WidgetConfig, WidgetType, defaultWidgetConfig } from '../../types/config';
import './WidgetManager.css';

interface WidgetFormData {
  type: WidgetType;
  size: { width: number; height: number };
  settings: {
    isAlwaysOnTop: boolean;
    opacity: number;
    customCSS: string;
  };
}

export const WidgetManager: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<WidgetFormData>({
    type: 'clock',
    size: {
      width: defaultWidgetConfig.size!.width,
      height: defaultWidgetConfig.size!.height
    },
    settings: {
      isAlwaysOnTop: false,
      opacity: 1,
      customCSS: ''
    }
  });

  useEffect(() => {
    // Load widgets from store
    window.api.listWidgets().then((loadedWidgets: WidgetConfig[]) => {
      setWidgets(loadedWidgets);
    });
  }, []);

  const handleAddWidget = async () => {
    try {
      const newWidget = await window.api.addWidget({
        type: formData.type,
        position: { x: 0, y: 0 }, // Default position
        size: {
          width: formData.size.width,
          height: formData.size.height
        },
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS
        }
      });
      setWidgets([...widgets, newWidget]);
      setIsEditing(false);
    } catch (error) {
      console.error('Error adding widget:', error);
      // TODO: Show error message to user
    }
  };

  const handleUpdateWidget = async (id: string) => {
    try {
      const updatedWidget = await window.api.updateWidget(id, {
        size: {
          width: formData.size.width,
          height: formData.size.height
        },
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS
        }
      });
      const updatedWidgets = widgets.map(w => 
        w.id === id ? updatedWidget : w
      );
      setWidgets(updatedWidgets);
      setIsEditing(false);
      setSelectedWidget(null);
    } catch (error) {
      console.error('Error updating widget:', error);
      // TODO: Show error message to user
    }
  };

  const handleRemoveWidget = async (id: string) => {
    try {
      await window.api.deleteWidget(id);
      setWidgets(widgets.filter(w => w.id !== id));
      if (selectedWidget === id) {
        setSelectedWidget(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error removing widget:', error);
      // TODO: Show error message to user
    }
  };

  const handleEditWidget = (widget: WidgetConfig) => {
    setSelectedWidget(widget.id);
    setFormData({
      type: widget.type,
      size: {
        width: widget.size.width,
        height: widget.size.height
      },
      settings: {
        isAlwaysOnTop: widget.settings?.isAlwaysOnTop ?? false,
        opacity: widget.settings?.opacity ?? 1,
        customCSS: widget.settings?.customCSS ?? ''
      }
    });
    setIsEditing(true);
  };

  return (
    <div className="widget-manager">
      <div className="widget-list">
        <div className="widget-list-header">
          <h3>Installed Widgets</h3>
          <button
            className="add-widget-button"
            onClick={() => {
              setSelectedWidget(null);
              setFormData({
                type: 'clock',
                size: {
                  width: defaultWidgetConfig.size!.width,
                  height: defaultWidgetConfig.size!.height
                },
                settings: {
                  isAlwaysOnTop: false,
                  opacity: 1,
                  customCSS: ''
                }
              });
              setIsEditing(true);
            }}
          >
            Add Widget
          </button>
        </div>
        
        {widgets.map(widget => (
          <div
            key={widget.id}
            className={`widget-item ${selectedWidget === widget.id ? 'selected' : ''}`}
          >
            <div className="widget-info">
              <span className="widget-type">{widget.type}</span>
              <span className="widget-size">
                {widget.size.width}×{widget.size.height}
              </span>
            </div>
            <div className="widget-actions">
              <button
                className="edit-button"
                onClick={() => handleEditWidget(widget)}
              >
                Edit
              </button>
              <button
                className="remove-button"
                onClick={() => handleRemoveWidget(widget.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="widget-form">
          <h3>{selectedWidget ? 'Edit Widget' : 'Add New Widget'}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            selectedWidget ? handleUpdateWidget(selectedWidget) : handleAddWidget();
          }}>
            {!selectedWidget && (
              <div className="form-group">
                <label>Type:</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as WidgetType
                  })}
                >
                  <option value="clock">Clock</option>
                  <option value="weather">Weather</option>
                  <option value="notes">Notes</option>
                  <option value="calendar">Calendar</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Size:</label>
              <div className="size-inputs">
                <input
                  type="number"
                  min="50"
                  max="2000"
                  value={formData.size.width}
                  onChange={(e) => setFormData({
                    ...formData,
                    size: { ...formData.size, width: Number(e.target.value) }
                  })}
                />
                <span>×</span>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  value={formData.size.height}
                  onChange={(e) => setFormData({
                    ...formData,
                    size: { ...formData.size, height: Number(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.isAlwaysOnTop}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, isAlwaysOnTop: e.target.checked }
                  })}
                />
                Always on Top
              </label>
            </div>

            <div className="form-group">
              <label>Opacity:</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={formData.settings.opacity}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, opacity: Number(e.target.value) }
                })}
              />
              <span>{(formData.settings.opacity * 100).toFixed(0)}%</span>
            </div>

            <div className="form-group">
              <label>Custom CSS:</label>
              <textarea
                value={formData.settings.customCSS}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, customCSS: e.target.value }
                })}
                placeholder="Enter custom CSS rules..."
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {selectedWidget ? 'Update Widget' : 'Add Widget'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedWidget(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}; 