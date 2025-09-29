import React from 'react';
import type { IconType } from 'react-icons';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: IconType;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon: Icon,
  title = '',
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3';
      case 'lg':
        return 'p-5';
      default:
        return 'p-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800';
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800';
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800';
      default:
        return 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-16 right-8 ${getSizeClasses()} ${getVariantClasses()}
        text-white rounded-full shadow-2xl hover:shadow-3xl
        transition-all duration-300 transform hover:scale-110 hover:-translate-y-1
        z-[60] group active:scale-95
        ${className}
      `}
      title={title}
    >
      <Icon className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
    </button>
  );
};

export default FloatingActionButton;