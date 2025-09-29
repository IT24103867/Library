import React from 'react';
import { FiHeart } from 'react-icons/fi';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>© {currentYear} Library Management System</span>
          <span>•</span>
          <span>All rights reserved</span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <a href="#" className="hover:text-gray-900 transition-colors duration-200">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="#" className="hover:text-gray-900 transition-colors duration-200">
            Terms of Service
          </a>
          <span>•</span>
          <a href="#" className="hover:text-gray-900 transition-colors duration-200">
            Support
          </a>
        </div>

        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <span>Made with</span>
          <FiHeart className="h-4 w-4 text-red-500" />
          <span>for book lovers</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;