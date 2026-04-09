import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error('Failed to parse saved notifications', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join-user', user.id);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('notification', (notification) => {
        addNotification(notification);
        toast(notification.message, {
          icon: getNotificationIcon(notification.type),
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        });
      });

      newSocket.on('request-status-change', (data) => {
        addNotification({
          type: 'request',
          title: 'Request Status Update',
          message: `Request #${data.requestNumber} is now ${data.status}`,
          link: `/requests/${data.requestId}`,
          data
        });
      });

      newSocket.on('low-stock-alert', (data) => {
        addNotification({
          type: 'alert',
          title: 'Low Stock Alert',
          message: `${data.name} is low on stock (${data.quantity} remaining)`,
          link: '/inventory',
          data
        });
        toast.error(`${data.name} is low on stock!`, {
          duration: 8000,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request': return '📋';
      case 'checkout': return '📦';
      case 'alert': return '⚠️';
      default: return '🔔';
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const removed = notifications.find(n => n.id === id);
    if (removed && !removed.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    connected,
    addNotification,
    markAsRead,
    markAllRead,
    clearAll,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};