import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiX, FiAlertCircle, FiPackage, FiClipboard } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        newSocket.emit('join-user', user.id);
      });

      newSocket.on('notification', (notification) => {
        setNotifications(prev => [{
          ...notification,
          id: Date.now(),
          read: false,
          timestamp: new Date()
        }, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('request-status-change', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'request',
          title: 'Request Status Update',
          message: `Request #${data.requestNumber} is now ${data.status}`,
          read: false,
          timestamp: new Date(),
          link: `/requests/${data.requestId}`
        }, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'request':
        return <FiClipboard className="text-blue-500" size={18} />;
      case 'checkout':
        return <FiPackage className="text-green-500" size={18} />;
      case 'alert':
        return <FiAlertCircle className="text-red-500" size={18} />;
      default:
        return <FiBell className="text-gray-500" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative focus:outline-none"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex space-x-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link || '#'}
                  onClick={() => {
                    markAsRead(notification.id);
                    setShowDropdown(false);
                  }}
                  className={`block p-3 border-b hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markAsRead(notification.id);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-green-500"
                      >
                        <FiCheck size={14} />
                      </button>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <FiBell className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
