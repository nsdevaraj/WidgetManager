import React, { useState, useEffect, useCallback } from 'react';
import { WidgetConfig, WidgetType, defaultWidgetConfig, WidgetGroup } from '../../types/config';
import { WidgetPreview } from './WidgetPreview';
import { NotificationManager, setNotificationManager, showNotification } from './NotificationManager';
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

// UUID generation with proper TypeScript support
function generateUUID(): string {
  // Use crypto.randomUUID() if available, with type assertion
  if ('randomUUID' in crypto) {
    return (crypto as Crypto & { randomUUID(): string }).randomUUID();
  }

  // Fallback implementation using crypto.getRandomValues()
  const getRandomHex = (c: string): string => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0];
    const v = c === 'x' ? (r & 0x0f) | 0x40 : (r & 0x3f) | 0x80;
    return v.toString(16);
  };

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, getRandomHex);
}

export const WidgetManager: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastSelectedWidget, setLastSelectedWidget] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkOperationInProgress, setIsBulkOperationInProgress] = useState(false);
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
  const [groups, setGroups] = useState<WidgetGroup[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    loadWidgets();
  }, []);

  useEffect(() => {
    setNotificationManager({
      addNotification: (notification) => {
        // Implementation will be handled by NotificationManager component
      }
    });
  }, []);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelectionMode) return;

      // Prevent default browser shortcuts
      if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'd')) {
        e.preventDefault();
      }

      // Cmd/Ctrl + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        selectAllWidgets();
      }
      // Cmd/Ctrl + D to deselect all
      else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        deselectAllWidgets();
      }
      // Escape to exit selection mode
      else if (e.key === 'Escape') {
        setIsSelectionMode(false);
        setSelectedWidgets(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode]);

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
      showNotification('error', validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }

      // Show creating notification
      showNotification('info', 'Creating widget...', 2000);

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

      // Show success notification
      showNotification('success', 'Widget created successfully!');

      // Reset form
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
    } catch (error) {
      console.error('Error adding widget:', error);
      showNotification('error', 'Failed to create widget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWidget = async (id: string) => {
    const validationError = validateForm();
    if (validationError) {
      showNotification('error', validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }

      // Show updating notification
      showNotification('info', 'Updating widget...', 2000);

      const updatedWidget = await window.api.updateWidget(id, {
        size: formData.size,
        settings: {
          isAlwaysOnTop: formData.settings.isAlwaysOnTop,
          opacity: formData.settings.opacity,
          customCSS: formData.settings.customCSS,
          ...(formData.type === 'url' && { initialUrl: formData.settings.initialUrl })
        }
      });

      setWidgets(widgets.map(w => w.id === id ? updatedWidget : w));
      setIsEditing(false);
      setSelectedWidget(null);
      setError(null);

      // Show success notification
      showNotification('success', 'Widget updated successfully!');
    } catch (error) {
      console.error('Failed to update widget:', error);
      showNotification('error', 'Failed to update widget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWidget = async (id: string) => {
    try {
      if (!window.api) {
        throw new Error('Electron API not available');
      }

      // Show removing notification
      showNotification('info', 'Removing widget...', 2000);

      await window.api.deleteWidget(id);
      setWidgets(widgets.filter(w => w.id !== id));
      
      if (selectedWidget === id) {
        setSelectedWidget(null);
        setIsEditing(false);
      }

      // Show success notification
      showNotification('success', 'Widget removed successfully!');
    } catch (error) {
      console.error('Failed to remove widget:', error);
      showNotification('error', 'Failed to remove widget. Please try again.');
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

  // Add selection handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedWidgets(new Set());
    }
  };

  const toggleWidgetSelection = (widgetId: string, event: React.MouseEvent) => {
    if (!isSelectionMode) {
      if (!event.metaKey && !event.ctrlKey) {
        handleEditWidget(widgets.find(w => w.id === widgetId)!);
        return;
      }
      setIsSelectionMode(true);
    }

    if (event.shiftKey && lastSelectedWidget && isSelectionMode) {
      // Find indices for range selection
      const widgetIds = widgets.map(w => w.id);
      const currentIndex = widgetIds.indexOf(widgetId);
      const lastIndex = widgetIds.indexOf(lastSelectedWidget);
      
      // Select all widgets between last selected and current
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      
      setSelectedWidgets(prev => {
        const newSelection = new Set(prev);
        for (let i = start; i <= end; i++) {
          newSelection.add(widgetIds[i]);
        }
        return newSelection;
      });
    } else {
      setSelectedWidgets(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(widgetId)) {
          newSelection.delete(widgetId);
        } else {
          newSelection.add(widgetId);
        }
        return newSelection;
      });
      setLastSelectedWidget(widgetId);
    }
  };

  const selectAllWidgets = () => {
    setSelectedWidgets(new Set(widgets.map(w => w.id)));
  };

  const deselectAllWidgets = () => {
    setSelectedWidgets(new Set());
  };

  // Load groups from settings
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const settings = await window.api.getSettings();
        if (settings.widgetGroups) {
          // Ensure all required properties are present
          const validGroups = settings.widgetGroups.filter((group): group is WidgetGroup => {
            return (
              typeof group.id === 'string' &&
              typeof group.name === 'string' &&
              Array.isArray(group.widgetIds) &&
              typeof group.isVisible === 'boolean' &&
              typeof group.createdAt === 'number' &&
              typeof group.updatedAt === 'number'
            );
          });
          setGroups(validGroups);
        } else {
          setGroups([]);
        }
      } catch (error) {
        console.error('Failed to load widget groups:', error);
        showNotification('error', 'Failed to load widget groups');
      }
    };
    loadGroups();
  }, []);

  // Group management functions
  const handleCreateGroup = async () => {
    if (!newGroupName || selectedWidgets.size === 0) return;

    try {
      const newGroup: WidgetGroup = {
        id: generateUUID(),
        name: newGroupName.trim(),
        widgetIds: Array.from(selectedWidgets),
        isVisible: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updatedGroups = [...groups, newGroup];
      await window.api.updateSettings({ widgetGroups: updatedGroups });
      setGroups(updatedGroups);
      setNewGroupName('');
      setIsCreatingGroup(false);
      showNotification('success', `Created group "${newGroup.name}" with ${selectedWidgets.size} widgets`);
    } catch (error) {
      console.error('Failed to create widget group:', error);
      showNotification('error', 'Failed to create widget group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      const confirmed = window.confirm(`Are you sure you want to delete the group "${group.name}"?`);
      if (!confirmed) return;

      const updatedGroups = groups.filter(g => g.id !== groupId);
      await window.api.updateSettings({ widgetGroups: updatedGroups });
      setGroups(updatedGroups);
      showNotification('success', `Deleted group "${group.name}"`);
    } catch (error) {
      console.error('Failed to delete widget group:', error);
      showNotification('error', 'Failed to delete widget group');
    }
  };

  const handleToggleGroupVisibility = async (groupId: string) => {
    try {
      const groupIndex = groups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) return;

      const group = groups[groupIndex];
      const updatedGroup = { ...group, isVisible: !group.isVisible };
      
      // Update widgets in the group
      await handleBulkVisibility(!group.isVisible, group.widgetIds);
      
      // Update group state
      const updatedGroups = [...groups];
      updatedGroups[groupIndex] = updatedGroup;
      await window.api.updateSettings({ widgetGroups: updatedGroups });
      setGroups(updatedGroups);
    } catch (error) {
      console.error('Failed to toggle group visibility:', error);
      showNotification('error', 'Failed to update group visibility');
    }
  };

  // Update bulk visibility handler to accept specific widget IDs
  const handleBulkVisibility = async (visible: boolean, widgetIds?: string[]) => {
    const targetWidgets = widgetIds || Array.from(selectedWidgets);
    if (targetWidgets.length === 0) return;
    
    setIsBulkOperationInProgress(true);
    setError(null);

    try {
      const updates = { isVisible: visible };
      const operations = targetWidgets.map(id => 
        window.api.updateWidget(id, updates)
      );
      
      await Promise.all(operations);
      
      // Update local state
      setWidgets(widgets.map(w => 
        targetWidgets.includes(w.id)
          ? { ...w, isVisible: visible }
          : w
      ));
      
      if (!widgetIds) {
        showNotification(
          'success',
          `Successfully ${visible ? 'showed' : 'hid'} ${targetWidgets.length} widgets`
        );
      }
    } catch (error) {
      console.error('Failed to update widget visibility:', error);
      showNotification(
        'error',
        `Failed to ${visible ? 'show' : 'hide'} some widgets. Please try again.`
      );
    } finally {
      setIsBulkOperationInProgress(false);
    }
  };

  // Add bulk operation handlers
  const handleBulkAlwaysOnTop = async (alwaysOnTop: boolean) => {
    if (selectedWidgets.size === 0) return;
    
    setIsBulkOperationInProgress(true);
    setError(null);

    try {
      const updates = { settings: { isAlwaysOnTop: alwaysOnTop } };
      const operations = Array.from(selectedWidgets).map(id => 
        window.api.updateWidget(id, updates)
      );
      
      await Promise.all(operations);
      
      // Update local state
      setWidgets(widgets.map(w => 
        selectedWidgets.has(w.id) 
          ? { ...w, settings: { ...w.settings, isAlwaysOnTop: alwaysOnTop } }
          : w
      ));
      
      showNotification(
        'success',
        `Successfully ${alwaysOnTop ? 'pinned' : 'unpinned'} ${selectedWidgets.size} widgets`
      );
    } catch (error) {
      console.error('Failed to update widget always-on-top:', error);
      showNotification(
        'error',
        `Failed to ${alwaysOnTop ? 'pin' : 'unpin'} some widgets. Please try again.`
      );
    } finally {
      setIsBulkOperationInProgress(false);
    }
  };

  const handleBulkOpacity = async (opacity: number) => {
    if (selectedWidgets.size === 0) return;
    
    setIsBulkOperationInProgress(true);
    setError(null);

    try {
      const updates = { settings: { opacity } };
      const operations = Array.from(selectedWidgets).map(id => 
        window.api.updateWidget(id, updates)
      );
      
      await Promise.all(operations);
      
      // Update local state
      setWidgets(widgets.map(w => 
        selectedWidgets.has(w.id) 
          ? { ...w, settings: { ...w.settings, opacity } }
          : w
      ));
      
      showNotification(
        'success',
        `Successfully set opacity to ${Math.round(opacity * 100)}% for ${selectedWidgets.size} widgets`
      );
    } catch (error) {
      console.error('Failed to update widget opacity:', error);
      showNotification(
        'error',
        'Failed to update opacity for some widgets. Please try again.'
      );
    } finally {
      setIsBulkOperationInProgress(false);
    }
  };

  // Update the bulk delete handler with loading state
  const handleBulkDelete = async () => {
    if (selectedWidgets.size === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedWidgets.size} widgets?`);
    if (!confirmed) return;

    setIsBulkOperationInProgress(true);
    setError(null);

    try {
      const operations = Array.from(selectedWidgets).map(id => 
        window.api.deleteWidget(id)
      );
      
      await Promise.all(operations);
      
      setWidgets(widgets.filter(w => !selectedWidgets.has(w.id)));
      setSelectedWidgets(new Set());
      showNotification('success', `Successfully deleted ${selectedWidgets.size} widgets`);
    } catch (error) {
      console.error('Failed to delete widgets:', error);
      showNotification('error', 'Failed to delete some widgets. Please try again.');
    } finally {
      setIsBulkOperationInProgress(false);
    }
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
      <NotificationManager maxNotifications={3} />
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="widget-list">
        <div className="widget-list-header">
          <div className="widget-list-title">
            <h3>Installed Widgets</h3>
            {widgets.length > 0 && (
              <div className="selection-controls">
                <button
                  className={`selection-mode-button ${isSelectionMode ? 'active' : ''}`}
                  onClick={toggleSelectionMode}
                >
                  {isSelectionMode ? 'Exit Selection' : 'Select Multiple'}
                </button>
                {isSelectionMode && (
                  <span className="selection-shortcuts">
                    Shortcuts: ⌘A (Select All), ⌘D (Deselect All), Esc (Exit), Shift+Click (Range)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="widget-list-actions">
            {isSelectionMode ? (
              <div className="bulk-actions">
                <button
                  className="select-all-button"
                  onClick={selectAllWidgets}
                  disabled={widgets.length === selectedWidgets.size || isBulkOperationInProgress}
                >
                  Select All
                </button>
                <button
                  className="deselect-all-button"
                  onClick={deselectAllWidgets}
                  disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                >
                  Deselect All
                </button>
                <div className="bulk-operations">
                  <button
                    onClick={() => handleBulkVisibility(true)}
                    disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => handleBulkVisibility(false)}
                    disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => handleBulkAlwaysOnTop(true)}
                    disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                  >
                    Pin to Top
                  </button>
                  <button
                    onClick={() => handleBulkAlwaysOnTop(false)}
                    disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                  >
                    Unpin
                  </button>
                  <div className="bulk-opacity">
                    <label>Opacity:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      defaultValue="1"
                      onChange={(e) => handleBulkOpacity(Number(e.target.value))}
                      disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                    />
                  </div>
                  <button
                    className="bulk-delete-button"
                    onClick={handleBulkDelete}
                    disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                  >
                    Delete Selected ({selectedWidgets.size})
                  </button>
                  <div className="group-actions">
                    {isCreatingGroup ? (
                      <div className="create-group-form">
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Group name"
                          disabled={isBulkOperationInProgress}
                        />
                        <button
                          onClick={handleCreateGroup}
                          disabled={!newGroupName.trim() || selectedWidgets.size === 0 || isBulkOperationInProgress}
                        >
                          Create Group
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingGroup(false);
                            setNewGroupName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsCreatingGroup(true)}
                        disabled={selectedWidgets.size === 0 || isBulkOperationInProgress}
                      >
                        Save as Group
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
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
              const isSelected = selectedWidgets.has(widget.id);
              return (
                <div
                  key={widget.id}
                  className={`widget-item ${isSelected ? 'selected' : ''} ${isSelectionMode ? 'selectable' : ''}`}
                  onClick={(e) => toggleWidgetSelection(widget.id, e)}
                >
                  {isSelectionMode && (
                    <div className="widget-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleWidgetSelection(widget.id, {} as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="widget-info">
                    <span className="widget-type">{typeInfo?.icon} {typeInfo?.label || widget.type}</span>
                    <span className="widget-size">{widget.size.width}×{widget.size.height}</span>
                  </div>
                  {!isSelectionMode && (
                    <div className="widget-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleEditWidget(widget); }}>Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveWidget(widget.id); }}>Remove</button>
                    </div>
                  )}
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

          <div className="form-layout">
            <div className="form-column">
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
                        Preview in Browser
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
                  placeholder="Enter custom CSS as JSON object"
                  disabled={isLoading}
                />
                <span className="help-text">Optional: Customize widget appearance with CSS properties in JSON format</span>
              </div>

              <div className="form-actions">
                <button
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
                <button
                  className="save-button"
                  onClick={() => selectedWidget ? handleUpdateWidget(selectedWidget) : handleAddWidget()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : selectedWidget ? 'Update Widget' : 'Add Widget'}
                </button>
              </div>
            </div>

            <div className="form-column">
              <WidgetPreview
                type={formData.type}
                size={formData.size}
                settings={formData.settings}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add widget groups section */}
      {groups.length > 0 && !isSelectionMode && (
        <div className="widget-groups">
          <h4>Widget Groups</h4>
          <div className="group-list">
            {groups.map(group => (
              <div key={group.id} className="group-item">
                <div className="group-info">
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">{group.widgetIds.length} widgets</span>
                </div>
                <div className="group-actions">
                  <button
                    onClick={() => handleToggleGroupVisibility(group.id)}
                    title={group.isVisible ? 'Hide group' : 'Show group'}
                  >
                    {group.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWidgets(new Set(group.widgetIds));
                      setIsSelectionMode(true);
                    }}
                    title="Select group widgets"
                  >
                    Select
                  </button>
                  <button
                    className="delete-group"
                    onClick={() => handleDeleteGroup(group.id)}
                    title="Delete group"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 