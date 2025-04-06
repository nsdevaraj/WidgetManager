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

interface WidgetTypeInfo {
  type: WidgetType;
  label: string;
  description: string;
  defaultSize: { width: number; height: number };
  icon: string;
  settings?: string[];
}

const WIDGET_TYPES: WidgetTypeInfo[] = [
  {
    type: 'clock',
    label: 'Clock Widget',
    description: 'Displays current time in various formats',
    defaultSize: { width: 200, height: 100 },
    icon: '🕐',
    settings: ['format', 'timezone']
  },
  {
    type: 'weather',
    label: 'Weather Widget',
    description: 'Shows weather information for your location',
    defaultSize: { width: 300, height: 200 },
    icon: '🌤️',
    settings: ['location', 'unit']
  },
  {
    type: 'notes',
    label: 'Notes Widget',
    description: 'Quick access notepad for your thoughts',
    defaultSize: { width: 250, height: 300 },
    icon: '📝',
    settings: ['fontSize', 'theme']
  },
  {
    type: 'calendar',
    label: 'Calendar Widget',
    description: 'View and manage your calendar events',
    defaultSize: { width: 400, height: 300 },
    icon: '📅',
    settings: ['view', 'source']
  },
  {
    type: 'url',
    label: 'Web Widget',
    description: 'Embed any website as a widget',
    defaultSize: { width: 400, height: 400 },
    icon: '🌐',
    settings: ['initialUrl', 'refresh']
  }
];

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
      if (!window.api) {
        throw new Error('Electron API not available');
      }
      const loadedWidgets = await window.api.listWidgets();
      setWidgets(loadedWidgets);
    } catch (error) {
      console.error('Failed to load widgets:', error);
      setError('Failed to load widgets. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: WidgetType) => {
    const typeInfo = WIDGET_TYPES.find(t => t.type === type);
    if (typeInfo) {
      setFormData({
        ...formData,
        type,
        size: typeInfo.defaultSize,
        settings: {
          ...formData.settings,
          initialUrl: type === 'url' ? formData.settings.initialUrl || 'https://duckduckgo.com/' : undefined
        }
      });
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validateForm = (): string | null => {
    if (formData.size.width < 50 || formData.size.height < 50) {
      return 'Widget size must be at least 50x50 pixels';
    }
    if (formData.settings.opacity < 0.1 || formData.settings.opacity > 1) {
      return 'Opacity must be between 0.1 and 1';
    }
    if (formData.type === 'url') {
      if (!formData.settings.initialUrl) {
        return 'URL is required for web widgets';
      }
      if (!validateUrl(formData.settings.initialUrl)) {
        return 'Please enter a valid http:// or https:// URL';
      }
    }
    if (formData.settings.customCSS) {
      try {
        JSON.parse(formData.settings.customCSS);
      } catch {
        return 'Custom CSS must be a valid JSON object';
      }
    }
    return null;
  };

  const handleAddWidget = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }
      const newWidget = await window.api.addWidget({
        type: formData.type,
        position: { x: 0, y: 0 }, // Default position
        size: formData.size,
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS,
          ...(formData.type === 'url' && { initialUrl: formData.settings.initialUrl })
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
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }
      const updatedWidget = await window.api.updateWidget(id, {
        size: formData.size,
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS,
          ...(formData.type === 'url' && { initialUrl: formData.settings.initialUrl })
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
      if (!window.api) {
        throw new Error('Electron API not available');
      }
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
        customCSS: widget.settings?.customCSS ?? '',
        initialUrl: widget.settings?.initialUrl
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
                size: WIDGET_TYPES[0].defaultSize,
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
            <p>Click "Add Widget" to create your first widget.</p>
          </div>
        ) : (
          <div className="widget-grid">
            {widgets.map(widget => {
              const typeInfo = WIDGET_TYPES.find(t => t.type === widget.type);
              return (
                <div key={widget.id} className={`widget-item ${selectedWidget === widget.id ? 'selected' : ''}`}>
                  <div className="widget-info">
                    <span className="widget-type">{typeInfo?.icon} {typeInfo?.label || widget.type}</span>
                    <span className="widget-size">{widget.size.width}×{widget.size.height}</span>
                  </div>
                  <div className="widget-actions">
                    <button onClick={() => handleEditWidget(widget)}>Edit</button>
                    <button onClick={() => handleRemoveWidget(widget.id)}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="widget-form">
          <h3>{selectedWidget ? 'Edit Widget' : 'Add New Widget'}</h3>
          
          {!selectedWidget && (
            <div className="form-group">
              <label>Widget Type:</label>
              <div className="widget-type-grid">
                {WIDGET_TYPES.map(typeInfo => (
                  <button
                    key={typeInfo.type}
                    className={`widget-type-button ${formData.type === typeInfo.type ? 'selected' : ''}`}
                    onClick={() => handleTypeChange(typeInfo.type)}
                    disabled={isLoading}
                  >
                    <span className="widget-type-icon">{typeInfo.icon}</span>
                    <span className="widget-type-label">{typeInfo.label}</span>
                    <span className="widget-type-description">{typeInfo.description}</span>
                  </button>
                ))}
              </div>
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
            <span className="help-text">Minimum size: 50×50 pixels</span>
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
            <span className="help-text">Keep widget above other windows</span>
          </div>

          <div className="form-group">
            <label>Opacity:</label>
            <div className="opacity-control">
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
            <span className="help-text">Adjust widget transparency</span>
          </div>

          {formData.type === 'url' && (
            <div className="form-group">
              <label>Initial URL:</label>
              <div className="url-input-container">
                <input
                  type="url"
                  value={formData.settings.initialUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, initialUrl: url }
                    });
                    // Clear error if URL becomes valid
                    if (validateUrl(url) && error?.includes('URL')) {
                      setError(null);
                    }
                  }}
                  placeholder="Enter URL (e.g., https://google.com)"
                  disabled={isLoading}
                  className={error?.includes('URL') ? 'error' : ''}
                />
                {formData.settings.initialUrl && (
                  <button
                    className="preview-button"
                    onClick={() => {
                      if (validateUrl(formData.settings.initialUrl!)) {
                        window.open(formData.settings.initialUrl, '_blank', 'width=800,height=600');
                      } else {
                        setError('Please enter a valid URL before previewing');
                      }
                    }}
                    disabled={isLoading || !validateUrl(formData.settings.initialUrl)}
                  >
                    Preview
                  </button>
                )}
              </div>
              <span className="help-text">
                {error?.includes('URL') ? (
                  <span className="error-text">{error}</span>
                ) : (
                  'The webpage to display in the widget'
                )}
              </span>
            </div>
          )}

          <div className="form-group">
            <label>Custom CSS:</label>
            <textarea
              value={formData.settings.customCSS}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, customCSS: e.target.value }
              })}
              placeholder="Enter custom CSS as a JSON object..."
              disabled={isLoading}
            />
            <div className="help-text">
              <p>Custom styles in JSON format. Example:</p>
              <pre>{`{
  "backgroundColor": "#f0f0f0",
  "borderRadius": "8px",
  "boxShadow": "0 2px 4px rgba(0,0,0,0.1)"
}`}</pre>
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={() => selectedWidget ? handleUpdateWidget(selectedWidget) : handleAddWidget()}
              disabled={isLoading}
            >
              {selectedWidget ? 'Update Widget' : 'Add Widget'}
            </button>
            <button
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
        </div>
      )}
    </div>
  );
}; 