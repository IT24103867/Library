import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Notification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { webSocketService } from '../services/webSocketService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  autoRefreshEnabled: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  const refreshNotifications = async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      const [notificationsData, unreadData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadData.unreadCount);
      setConsecutiveFailures(0); // Reset failure count on success
      setAutoRefreshEnabled(true); // Re-enable auto-refresh on success
    } catch (error) {
      const newFailureCount = consecutiveFailures + 1;
      setConsecutiveFailures(newFailureCount);

      // Disable auto-refresh immediately on first failure
      console.warn('Disabling auto-refresh due to API failure');
      setAutoRefreshEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  const retryConnection = async () => {
    setConsecutiveFailures(0);
    setAutoRefreshEnabled(true);
    await refreshNotifications();
  };

  // WebSocket event handlers
  useEffect(() => {
    // Handle real-time notifications
    webSocketService.onNotification((notification) => {
      console.log('Received real-time notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle unread count updates
    webSocketService.onUnreadCountUpdate((count) => {
      console.log('Received unread count update:', count);
      setUnreadCount(count);
    });

    // Handle WebSocket connection
    webSocketService.onConnect(() => {
      console.log('WebSocket connected for notifications');
    });

    webSocketService.onDisconnect(() => {
      console.log('WebSocket disconnected for notifications');
    });

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // Auto-refresh every 2 minutes (only if enabled)
  useEffect(() => {
    // Clear any existing interval first
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    if (!autoRefreshEnabled) {
      return;
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 120000); // 2 minutes in milliseconds

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled]);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    autoRefreshEnabled,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    retryConnection,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};