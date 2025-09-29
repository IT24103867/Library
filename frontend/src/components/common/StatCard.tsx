import React from 'react';
import type { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, className = '' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      title: 'text-blue-600',
      value: 'text-blue-900',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      title: 'text-green-600',
      value: 'text-green-900',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      title: 'text-yellow-600',
      value: 'text-yellow-900',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      title: 'text-purple-600',
      value: 'text-purple-900',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      title: 'text-red-600',
      value: 'text-red-900',
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      title: 'text-indigo-600',
      value: 'text-indigo-900',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} p-6 rounded-lg ${className}`}>
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${colors.icon}`} />
        <div className="ml-4">
          <p className={`text-sm font-medium ${colors.title}`}>{title}</p>
          <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;