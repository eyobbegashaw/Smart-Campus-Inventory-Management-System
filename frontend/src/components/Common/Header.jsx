
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to socket
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (user?.id) {
        newSocket.emit('join-user', user.id);
      }
    });
    
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast(notification.message, {
        icon: notification.type === 'request' ? '📋' : '🔔',
        duration: 5000
      });
    });
    
    newSocket.on('request-status-change', (data) => {
      toast.success(`Request ${data.requestNumber} status: ${data.status}`);
    });
    
    newSocket.on('low-stock-alert', (data) => {
      toast.error(`Low stock: ${data.name} (${data.quantity} remaining)`);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none lg:hidden"
            >
              <FiMenu size={24} />
            </button>
            <div className="ml-4 flex-shrink-0 hidden lg:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Campus Inventory
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative"
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-20">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => markAsRead(index)}
                        >
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-primary-600 font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <FiChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 border">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">Role: {user?.role}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <FiSettings className="inline mr-2" size={16} />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FiLogOut className="inline mr-2" size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
