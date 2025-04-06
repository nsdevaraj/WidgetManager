import React, { useState, useCallback } from 'react';
import { Notification, NotificationType } from './Notification';
import './NotificationManager.css';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationManagerProps {
  maxNotifications?: number;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxNotifications = 3
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    setNotifications(current => {
      const newNotifications = [
        { ...notification, id: Date.now().toString() },
        ...current
      ].slice(0, maxNotifications);
      return newNotifications;
    });
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(current =>
      current.filter(notification => notification.id !== id)
    );
  }, []);

  return (
    <div className="notification-manager">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Create a singleton instance for global access
let notificationManagerInstance: {
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
} | null = null;

export const setNotificationManager = (instance: {
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
}) => {
  notificationManagerInstance = instance;
};

export const showNotification = (
  type: NotificationType,
  message: string,
  duration?: number
) => {
  if (notificationManagerInstance) {
    notificationManagerInstance.addNotification({ type, message, duration });
  } else {
    console.warn('NotificationManager not initialized');
  }
}; 