import React from 'react';
import type { IconType } from 'react-icons';

interface EmptyStateProps {
  icon?: IconType;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionButton,
  className = ""
}) => {
  return (
    <div className={`p-8 text-center ${className}`}>
      {Icon && <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;