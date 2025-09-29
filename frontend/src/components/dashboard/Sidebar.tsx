import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiBook,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiPenTool,
  FiBriefcase,
  FiTag,
  FiGlobe,
  FiRefreshCw,
  FiDollarSign,
  FiCreditCard
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userRole: 'Admin' | 'Librarian' | 'Member';
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('success', 'Logged Out', 'You have been successfully logged out.');
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, roles: ['Admin', 'Librarian', 'Member'] },
    { name: 'Books', href: '/books', icon: FiBook, roles: ['Admin', 'Librarian', 'Member'] },
    { name: 'Transactions', href: '/transactions', icon: FiRefreshCw, roles: ['Admin', 'Librarian', 'Member'] },
    { name: 'Fines', href: '/fines', icon: FiDollarSign, roles: ['Admin', 'Librarian', 'Member'] },
    { name: 'Payments', href: '/payments', icon: FiCreditCard, roles: ['Admin', 'Librarian'] },
    { name: 'Authors', href: '/authors', icon: FiPenTool, roles: ['Admin', 'Librarian'] },
    { name: 'Publishers', href: '/publishers', icon: FiBriefcase, roles: ['Admin', 'Librarian'] },
    { name: 'Categories', href: '/categories', icon: FiTag, roles: ['Admin', 'Librarian'] },
    { name: 'Languages', href: '/languages', icon: FiGlobe, roles: ['Admin', 'Librarian'] },
    { name: 'Users', href: '/users', icon: FiUsers, roles: ['Admin', 'Librarian'] },
    { name: 'Analytics', href: '/analytics', icon: FiBarChart2, roles: ['Admin'] },
    { name: 'Profile', href: '/profile', icon: FiUser, roles: ['Admin', 'Librarian', 'Member'] },
    { name: 'Settings', href: '/settings', icon: FiSettings, roles: ['Admin'] },
  ];

  const filteredItems = navigationItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={`bg-gradient-to-b from-gray-900 via-gray-800 to-black shadow-2xl border-r border-gray-700 transition-all duration-500 ease-in-out transform flex flex-col h-full ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header with Logo */}
      <div className={`relative border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 ${
        isCollapsed ? 'p-3' : 'p-6'
      }`}>
        {!isCollapsed && (
          <>
            {/* Toggle Button for expanded state */}
            <button
              onClick={onToggle}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white transform hover:scale-110 z-10"
            >
              <FiChevronLeft className="h-5 w-5 transition-transform duration-300" />
            </button>

            {/* Logo and branding */}
            <div className="flex items-center space-x-4 animate-fade-in pr-12">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <FiBook className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Library
                </h2>
                <p className="text-xs text-gray-400 font-medium">Management System</p>
              </div>
            </div>
          </>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center items-center h-12">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-300 text-gray-300 hover:text-white transform hover:scale-110"
            >
              <FiChevronRight className="h-5 w-5 transition-transform duration-300" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden sidebar-scroll min-h-0 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {filteredItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center rounded-xl transition-all duration-300 group transform hover:scale-105 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white hover:shadow-md'
              } ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <item.icon className={`transition-all duration-300 ${
                isActive
                  ? 'text-white scale-110'
                  : 'group-hover:text-blue-400 group-hover:scale-110'
              } ${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-4'}`} />
              {!isCollapsed && (
                <span className="font-medium transition-all duration-300 group-hover:translate-x-1">
                  {item.name}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout - Fixed at bottom */}
      <div className={`mt-auto border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-900/30 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <button 
          onClick={handleLogout}
          className={`flex items-center w-full rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:text-white transition-all duration-300 group transform hover:scale-105 hover:shadow-lg ${
            isCollapsed ? 'p-3 justify-center' : 'px-4 py-3'
          }`}
        >
          <FiLogOut className={`transition-all duration-300 group-hover:rotate-12 ${
            isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-4'
          }`} />
          {!isCollapsed && (
            <span className="font-medium transition-all duration-300 group-hover:translate-x-1">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;