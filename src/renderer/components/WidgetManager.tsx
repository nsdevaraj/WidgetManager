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
    initialUrl?: string;
  };
}

export const WidgetManager: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WidgetFormData>({
    type: 'clock',
    size: {
      width: defaultWidgetConfig.size!.width,
      height: defaultWidgetConfig.size!.height
    },
    settings: {
      isAlwaysOnTop: false,
      opacity: 1,
      customCSS: '',
      initialUrl: ''
    }
  });

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedWidgets = await window.api.listWidgets();
      setWidgets(loadedWidgets);
    } catch (error) {
      console.error('Failed to load widgets:', error);
      setError('Failed to load widgets. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = async () => {
    setIsLoading(true);
    setError(null);
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
          customCSS: formData.settings.customCSS,
          ...(formData.type === 'url' && { initialUrl: formData.settings.initialUrl || 'https://duckduckgo.com/' })
        }
      });
      setWidgets([...widgets, newWidget]);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error adding widget:', error);
      setError('Failed to add widget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWidget = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedWidget = await window.api.updateWidget(id, {
        size: {
          width: formData.size.width,
          height: formData.size.height
        },
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS,
          ...(formData.type === 'url' && { initialUrl: formData.settings.initialUrl || 'https://duckduckgo.com/' })
        }
      });
      const updatedWidgets = widgets.map(w => 
        w.id === id ? updatedWidget : w
      );
      setWidgets(updatedWidgets);
      setIsEditing(false);
      setSelectedWidget(null);
      setError(null);
    } catch (error) {
      console.error('Error updating widget:', error);
      setError('Failed to update widget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWidget = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await window.api.deleteWidget(id);
      setWidgets(widgets.filter(w => w.id !== id));
      if (selectedWidget === id) {
        setSelectedWidget(null);
        setIsEditing(false);
      }
      setError(null);
    } catch (error) {
      console.error('Error removing widget:', error);
      setError('Failed to remove widget. Please try again.');
    } finally {
      setIsLoading(false);
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
    setError(null);
  };

  if (isLoading && widgets.length === 0) {
    return (
      <div className="widget-manager loading">
        <div className="loading-spinner" />
        <p>Loading widgets...</p>
      </div>
    );
  }

  return (
    <div className="widget-manager">
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
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
                  customCSS: '',
                  initialUrl: ''
                }
              });
              setIsEditing(true);
              setError(null);
            }}
            disabled={isLoading}
          >
            Add Widget
          </button>
        </div>
        
        {widgets.length === 0 ? (
          <div className="no-widgets">
            <p>No widgets installed yet.</p>
            <p>Click "Add Widget" to create your first widget!</p>
          </div>
        ) : (
          widgets.map(widget => (
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
                  disabled={isLoading}
                >
                  Edit
                </button>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveWidget(widget.id)}
                  disabled={isLoading}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
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
                  disabled={isLoading}
                >
                  <option value="clock">Clock</option>
                  <option value="weather">Weather</option>
                  <option value="notes">Notes</option>
                  <option value="calendar">Calendar</option>
                  <option value="url">URL</option>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {formData.type === 'url' && (
              <div className="form-group">
                <label>Initial URL:</label>
                <input
                  type="url"
                  value={formData.settings.initialUrl || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, initialUrl: e.target.value }
                  })}
                  placeholder="Enter URL (e.g., https://widgets.cursor.sh/welcome.html)"
                  disabled={isLoading}
                />
                <small className="help-text">
                  Many websites cannot be embedded due to security restrictions. Here are some URLs you can try:
                  <ul>
                    <li><code>https://widgets.cursor.sh/welcome.html</code> - Welcome page</li>
                    <li><code>https://widgets.cursor.sh/clock.html</code> - Simple clock</li>
                    <li><code>https://widgets.cursor.sh/weather.html</code> - Weather widget</li>
                  </ul>
                  To embed other websites, they must:
                  <ul>
                    <li>Allow embedding via Content Security Policy</li>
                    <li>Not use X-Frame-Options restrictions</li>
                    <li>Be served over HTTPS</li>
                  </ul>
                </small>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span>
                    <span className="loading-spinner small" />
                    {selectedWidget ? 'Updating...' : 'Adding...'}
                  </span>
                ) : (
                  selectedWidget ? 'Update Widget' : 'Add Widget'
                )}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedWidget(null);
                  setError(null);
                }}
                disabled={isLoading}
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