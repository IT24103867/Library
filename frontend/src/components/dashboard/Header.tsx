import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiRefreshCw, FiUser, FiBook, FiAlertTriangle, FiCheckCircle, FiCreditCard, FiClock, FiX } from 'react-icons/fi';
import { SearchBar } from '../common';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../Toast';
import type { Notification } from '../../types/notification';

interface HeaderProps {
  userName: string;
  userDisplayName?: string;
  userRole: string;
  profilePicture?: string;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, userDisplayName, userRole, profilePicture, onProfileClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const {
    notifications,
    unreadCount,
    loading,
    autoRefreshEnabled,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    retryConnection
  } = useNotifications();

  // Note: Notifications are loaded by NotificationContext on mount
  // No need to call refreshNotifications here to avoid duplicate calls

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      showToast('success', 'Success', 'Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      showToast('error', 'Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showToast('success', 'Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      showToast('error', 'Error', 'Failed to mark all notifications as read');
    }
  };

  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case 'BOOK_DUE_REMINDER':
        return {
          icon: FiClock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Due Reminder'
        };
      case 'BOOK_OVERDUE':
        return {
          icon: FiAlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Overdue'
        };
      case 'FINE_NOTICE':
        return {
          icon: FiCreditCard,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Fine Notice'
        };
      case 'BOOK_AVAILABLE':
        return {
          icon: FiCheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Book Available'
        };
      case 'BOOK_REQUEST_CONFIRMED':
        return {
          icon: FiBook,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Request Confirmed'
        };
      case 'PAYMENT_CONFIRMATION':
        return {
          icon: FiCreditCard,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'Payment Confirmed'
        };
      default:
        return {
          icon: FiBell,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Notification'
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const isRead = (notification: Notification) => !!notification.readAt;

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white shadow-lg border-b border-gray-200 px-6 py-4 backdrop-blur-sm relative z-[130]">
      <div className="flex items-center justify-end">

        {/* Right Side */}
        <div className="flex items-center space-x-4 gap-7">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={toggleNotifications}
              className="relative p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
            >
              <FiBell className={`h-6 w-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[120] max-h-[32rem] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="max-h-[32rem] overflow-y-auto custom-scrollbar">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <p className="text-sm text-gray-500">
                            {loading ? 'Loading...' : 
                             !autoRefreshEnabled ? 'Auto-refresh disabled due to connection issues' :
                             `You have ${unreadCount} unread notifications`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={refreshNotifications}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
                            title="Refresh notifications"
                          >
                            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                          </button>
                          {!autoRefreshEnabled && (
                            <button
                              onClick={retryConnection}
                              disabled={loading}
                              className="p-2 text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-blue-50 transition-colors"
                              title="Retry connection"
                            >
                              <FiRefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {unreadCount > 0 && !loading && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Close notifications"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const typeInfo = getNotificationTypeInfo(notification.type);
                      const IconComponent = typeInfo.icon;
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-l-4 ${
                            !isRead(notification)
                              ? `${typeInfo.bgColor} ${typeInfo.borderColor} border-l-4`
                              : 'border-l-transparent'
                          }`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 p-2 rounded-lg ${typeInfo.bgColor} ${typeInfo.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {notification.subject}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.bgColor} ${typeInfo.color} font-medium`}>
                                  {typeInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                                {!isRead(notification) && (
                                  <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    <span className="text-xs text-blue-600 font-medium">New</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FiBell className="h-8 w-8 text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        You don't have any notifications right now. We'll notify you when there's something important to know.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {userDisplayName || userName}
              </p>
              <p className="text-xs text-gray-500 font-medium">{userRole}</p>
            </div>
            <button
              onClick={onProfileClick}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;