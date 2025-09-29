import React from 'react';

interface StatusBadgeProps {
  status: string;
  text?: string;
  type?: 'role' | 'status' | 'custom';
  customColors?: {
    bg: string;
    text: string;
  };
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  type = 'status',
  customColors,
  className = ""
}) => {
  const getColors = (value: string, badgeType: string) => {
    if (customColors) {
      return customColors;
    }

    const lowerValue = value.toLowerCase();

    if (badgeType === 'role') {
      switch (lowerValue) {
        case 'admin':
          return { bg: 'bg-red-100', text: 'text-red-800' };
        case 'librarian':
          return { bg: 'bg-blue-100', text: 'text-blue-800' };
        case 'member':
          return { bg: 'bg-green-100', text: 'text-green-800' };
        default:
          return { bg: 'bg-gray-100', text: 'text-gray-800' };
      }
    } else {
      // status type
      switch (lowerValue) {
        case 'active':
          return { bg: 'bg-green-100', text: 'text-green-800' };
        case 'inactive':
          return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
        case 'suspended':
          return { bg: 'bg-red-100', text: 'text-red-800' };
        case 'pending':
          return { bg: 'bg-orange-100', text: 'text-orange-800' };
        default:
          return { bg: 'bg-gray-100', text: 'text-gray-800' };
      }
    }
  };

  const colors = getColors(status, type);

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text} ${className}`}>
      {text || status}
    </span>
  );
};

export default StatusBadge;