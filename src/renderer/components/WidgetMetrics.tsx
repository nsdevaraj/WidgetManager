import React, { useEffect, useState } from 'react';
import { WidgetResourceMetrics } from '../../types/config';
import { IpcRendererEvent } from 'electron';

interface WidgetMetricsProps {
  widgetId: string;
}

export const WidgetMetrics: React.FC<WidgetMetricsProps> = ({ widgetId }) => {
  const [metrics, setMetrics] = useState<WidgetResourceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateMetrics = (event: IpcRendererEvent, newMetrics: WidgetResourceMetrics) => {
    if (newMetrics.widgetId === widgetId) {
      setMetrics(newMetrics);
    }
  };

  useEffect(() => {
    window.api.getWidgetMetrics(widgetId).then(setMetrics);
    window.api.onMetricsUpdate(updateMetrics);

    return () => {
      window.api.offMetricsUpdate(updateMetrics);
    };
  }, [widgetId]);

  if (!metrics || !isVisible) {
    return (
      <div className="widget-metrics-toggle" onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? '❌' : '📊'}
      </div>
    );
  }

  return (
    <div className="widget-metrics">
      <div className="widget-metrics-header">
        <h4>Resource Metrics</h4>
        <button onClick={() => setIsVisible(false)}>❌</button>
      </div>
      <div className="widget-metrics-content">
        <div className="metric-item">
          <span>CPU Usage:</span>
          <span className={metrics.cpuUsage > 80 ? 'warning' : ''}>
            {metrics.cpuUsage.toFixed(1)}%
          </span>
        </div>
        <div className="metric-item">
          <span>Memory:</span>
          <span className={metrics.memoryUsage > 100 * 1024 * 1024 ? 'warning' : ''}>
            {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
        <div className="metric-item">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'warning' : ''}>
            {metrics.fps}
          </span>
        </div>
        <div className="metric-item">
          <span>Load Time:</span>
          <span>{metrics.loadTime}ms</span>
        </div>
        <div className="metric-item">
          <span>Network Requests:</span>
          <span>{metrics.networkRequests}</span>
        </div>
        <div className="metric-item">
          <span>Last Updated:</span>
          <span>{new Date(metrics.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}; 